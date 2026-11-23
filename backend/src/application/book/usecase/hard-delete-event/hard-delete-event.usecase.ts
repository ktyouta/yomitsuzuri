import { err, ok, Result } from "neverthrow";
import { EventId, type IHardDeleteEventRepository, type UserId } from "../../../../domain";

export type HardDeleteEventError =
  { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  eventId: string;
}

/**
 * 出来事の物理削除ユースケース
 */
export class HardDeleteEventUsecase {
  constructor(private readonly hardDeleteEventRepository: IHardDeleteEventRepository) { }

  /**
   * 出来事の物理削除
   * 論理削除済みの出来事を物理削除する。
   * @param userId 書籍を所有するユーザーID
   * @param eventId 物理削除の対象の出来事ID
   * @returns 成功時は ok。
   * 削除済みの出来事が存在しない（削除されていない出来事・他ユーザーの書籍の出来事を含む）場合は NOT_FOUND（削除しない）
   * @throws eventId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, eventId }: PropsType): Promise<Result<undefined, HardDeleteEventError>> {
    const id = EventId.of(eventId);

    // 物理削除（削除済みの出来事の存在・所有者は削除の条件で確認する）
    const deleted = await this.hardDeleteEventRepository.deleteEvent(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
