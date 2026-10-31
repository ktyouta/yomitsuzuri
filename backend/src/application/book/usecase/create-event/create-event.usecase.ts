import { err, ok, Result } from "neverthrow";
import { EventContent, EventOccurredTiming, UserId, WorkId, type EventContentError, type EventOccurredTimingError, type ICreateEventRepository } from "../../../../domain";
import { CreateEventResultDto } from "../../dto";

/**
 * 出来事作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateEventInputError =
  | { field: "occurredTiming"; error: EventOccurredTimingError }
  | { field: "content"; error: EventContentError };

export type CreateEventError =
  | { type: "INVALID_INPUT"; errors: CreateEventInputError[] }
  | { type: "NOT_FOUND" };

type CreateEventBody = {
  occurredTiming?: string | null;
  content: string;
};

type PropsType = {
  userId: UserId;
  workId: string;
  body: CreateEventBody;
};

/**
 * 出来事作成ユースケース
 */
export class CreateEventUsecase {
  constructor(private readonly createEventRepository: ICreateEventRepository,
  ) { }

  /**
   * 出来事作成
   * @param userId 書籍を所有するユーザーID
   * @param workId 出来事を追加する作品ID
   * @param body 出来事の登録内容
   * @returns 成功時は作成した出来事（作品内の時系列順の末尾に追加）の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・作品が存在しない（他ユーザーの書籍の作品・作品または書籍が論理削除済みを含む）場合はエラー（いずれも保存しない）
   * @throws workId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, workId, body }: PropsType): Promise<Result<CreateEventResultDto, CreateEventError>> {
    const id = WorkId.of(workId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      EventOccurredTiming.create(body.occurredTiming).mapErr((error): CreateEventInputError => ({ field: "occurredTiming", error })),
      EventContent.create(body.content).mapErr((error): CreateEventInputError => ({ field: "content", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [occurredTiming, content] = input.value;

    // 作品の存在・所有者チェック
    if (!(await this.createEventRepository.findWork(userId, id))) {
      return err({ type: "NOT_FOUND" });
    }

    const timeline = await this.createEventRepository.findEventTimeline(userId, id);
    const event = timeline.add({ occurredTiming, content });

    await this.createEventRepository.createEvent(event);

    return ok(new CreateEventResultDto(event));
  }
}
