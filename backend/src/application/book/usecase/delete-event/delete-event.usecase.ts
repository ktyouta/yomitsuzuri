import { err, ok, Result } from "neverthrow";
import type { IDeleteEventRepository } from "../../../../domain/book";
import { EventId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";

export type DeleteEventError =
  | { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  eventId: string;
}

/**
 * 出来事削除ユースケース
 */
export class DeleteEventUsecase {
  constructor(private readonly deleteEventRepository: IDeleteEventRepository,
  ) { }

  /**
   * 出来事削除（物理削除する）
   * @param userId 書籍を所有するユーザーID
   * @param eventId 削除する出来事ID
   * @returns 成功時は ok。
   * 出来事が存在しない（他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みを含む）場合はエラー（何も削除しない）
   * @throws eventId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, eventId }: PropsType): Promise<Result<undefined, DeleteEventError>> {
    const id = EventId.of(eventId);

    const deleted = await this.deleteEventRepository.deleteEvent(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
