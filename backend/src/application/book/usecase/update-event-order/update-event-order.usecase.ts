import { err, ok, Result } from "neverthrow";
import { EventId, EventSortOrder, UserId, WorkId, type EventIdError, type EventSortOrderError, type EventTimelineUpdateError, type IUpdateEventOrderRepository } from "../../../../domain";
import { UpdateEventOrderResultDto } from "../../dto";

/**
 * 出来事の並び順更新の入力値の制約違反（field は入力値の項目名。出来事は `events.{出来事の添字}.{項目名}`）
 */
export type UpdateEventOrderInputError =
  | { field: `events.${number}.id`; error: EventIdError }
  | { field: `events.${number}.sortOrder`; error: EventSortOrderError };

export type UpdateEventOrderError =
  | { type: "INVALID_INPUT"; errors: UpdateEventOrderInputError[] }
  | { type: "NOT_FOUND" }
  | EventTimelineUpdateError;

type UpdateEventOrderItem = {
  id: string;
  sortOrder: number;
};

type UpdateEventOrderBody = {
  events: UpdateEventOrderItem[];
};

type PropsType = {
  userId: UserId;
  workId: string;
  body: UpdateEventOrderBody;
};

/**
 * 出来事1件分の入力値から、時系列順の置き換えの指定を生成する
 * @param event 出来事1件分の入力値
 * @param index リクエスト内の出来事の添字（エラーの項目名に使う）
 * @returns 成功時は出来事ID と時系列順、制約違反時は違反をすべて持つ Result
 */
function createOrderParam(event: UpdateEventOrderItem, index: number) {
  return Result.combineWithAllErrors([
    EventId.fromInput(event.id).mapErr((error): UpdateEventOrderInputError => ({ field: `events.${index}.id`, error })),
    EventSortOrder.create(event.sortOrder).mapErr((error): UpdateEventOrderInputError => ({ field: `events.${index}.sortOrder`, error })),
  ]).map(([id, sortOrder]) => ({ id, sortOrder }));
}

/**
 * 出来事の並び順更新ユースケース
 */
export class UpdateEventOrderUsecase {
  constructor(private readonly updateEventOrderRepository: IUpdateEventOrderRepository) { }

  /**
   * 出来事の並び順更新（作品内のすべての出来事の時系列順を置き換える。時系列順以外の値は変えない）
   * @param userId 書籍を所有するユーザーID
   * @param workId 出来事が属する作品ID
   * @param body 作品内のすべての出来事の ID と、置き換え後の時系列順
   * @returns 成功時は時系列順を置き換えた出来事一覧（時系列順の昇順）の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・作品が存在しない（他ユーザーの書籍の作品・作品または書籍が論理削除済みを含む）・
   * 指定した出来事が作品内の出来事と過不足なく一致しない（EVENT_MISMATCH）・時系列順が重複する（DUPLICATE_SORT_ORDER）場合はエラー（いずれも保存しない）
   * @throws workId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, workId, body }: PropsType): Promise<Result<UpdateEventOrderResultDto, UpdateEventOrderError>> {
    const id = WorkId.of(workId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors(body.events.map(createOrderParam)).mapErr((errors) => errors.flat());
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }

    // 作品の存在・所有者チェック
    if (!(await this.updateEventOrderRepository.findWork(userId, id))) {
      return err({ type: "NOT_FOUND" });
    }

    // 時系列順の置き換え（作品内の出来事との照合・重複チェック）
    const timeline = await this.updateEventOrderRepository.findEventTimeline(userId, id);
    const updated = timeline.update(input.value);
    if (updated.isErr()) {
      return err(updated.error);
    }

    await this.updateEventOrderRepository.updateEventOrder(timeline);

    return ok(new UpdateEventOrderResultDto(timeline));
  }
}
