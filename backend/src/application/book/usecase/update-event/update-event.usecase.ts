import { err, ok, Result } from "neverthrow";
import { EventContent, EventId, EventOccurredTiming, type EventContentError, type EventOccurredTimingError, type IUpdateEventRepository, type UserId } from "../../../../domain";
import { UpdateEventResultDto } from "../../dto";

/**
 * 出来事更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateEventInputError =
  | { field: "occurredTiming"; error: EventOccurredTimingError }
  | { field: "content"; error: EventContentError };

export type UpdateEventError =
  | { type: "INVALID_INPUT"; errors: UpdateEventInputError[] }
  | { type: "NOT_FOUND" };

type UpdateEventBody = {
  occurredTiming?: string | null;
  content: string;
};

type PropsType = {
  userId: UserId;
  eventId: string;
  body: UpdateEventBody;
}

/**
 * 出来事更新ユースケース
 */
export class UpdateEventUsecase {
  constructor(private readonly updateEventRepository: IUpdateEventRepository) { }

  /**
   * 出来事更新（発生タイミング・内容を置き換える。ID・作品・時系列順・削除フラグは変えない）
   * @param userId 書籍を所有するユーザーID
   * @param eventId 更新する出来事ID
   * @param body 出来事の更新内容
   * @returns 成功時は更新した出来事の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・出来事が存在しない（他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みを含む）場合はエラー（いずれも保存しない）
   * @throws eventId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, eventId, body }: PropsType): Promise<Result<UpdateEventResultDto, UpdateEventError>> {
    const id = EventId.of(eventId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      EventOccurredTiming.create(body.occurredTiming).mapErr((error): UpdateEventInputError => ({ field: "occurredTiming", error })),
      EventContent.create(body.content).mapErr((error): UpdateEventInputError => ({ field: "content", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [occurredTiming, content] = input.value;

    // 出来事の存在・所有者チェック
    const event = await this.updateEventRepository.findEvent(userId, id);
    if (!event) {
      return err({ type: "NOT_FOUND" });
    }

    event.update({ occurredTiming, content });

    await this.updateEventRepository.updateEvent(event);

    return ok(new UpdateEventResultDto(event));
  }
}
