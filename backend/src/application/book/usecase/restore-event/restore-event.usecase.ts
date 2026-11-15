import { err, ok, Result } from "neverthrow";
import { EventId, type EventTimelineRestoreError, type IRestoreEventRepository, type UserId } from "../../../../domain";
import { RestoreEventResultDto } from "../../dto";

export type RestoreEventError =
  | EventTimelineRestoreError
  | { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  eventId: string;
}

/**
 * 出来事復元ユースケース
 */
export class RestoreEventUsecase {
  constructor(private readonly restoreEventRepository: IRestoreEventRepository) { }

  /**
   * 出来事復元（論理削除を解除し、時系列順を削除されていない出来事の最大値+1（末尾）にする。docs/delete-restore/plan.md の U13）
   * @param userId 書籍を所有するユーザーID
   * @param eventId 復元する出来事ID
   * @returns 成功時は復元した出来事の DTO。
   * 出来事が存在しない（他ユーザーの書籍の出来事・作品または書籍が論理削除済みを含む）場合は NOT_FOUND、
   * 出来事が削除されていない場合は EVENT_NOT_FOUND（いずれも保存しない）
   * @throws eventId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, eventId }: PropsType): Promise<Result<RestoreEventResultDto, RestoreEventError>> {
    const id = EventId.of(eventId);

    // 出来事の存在・所有者チェック
    const eventTimeline = await this.restoreEventRepository.findEventTimeline(userId, id);
    if (!eventTimeline) {
      return err({ type: "NOT_FOUND" });
    }

    const restoreResult = eventTimeline.restore(id);
    if (restoreResult.isErr()) {
      return err(restoreResult.error);
    }

    const event = restoreResult.value;
    await this.restoreEventRepository.restoreEvent(event);

    return ok(new RestoreEventResultDto(event));
  }
}
