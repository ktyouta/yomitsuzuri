import { err, ok, Result } from "neverthrow";
import { EventId, type IDeleteEventRepository, type UserId } from "../../../../domain";

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
   * 出来事削除（論理削除する）
   * @param userId 書籍を所有するユーザーID
   * @param eventId 削除する出来事ID
   * @returns 成功時は ok。
   * 出来事が存在しない（他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みを含む）場合はエラー（何も保存しない）
   * @throws eventId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, eventId }: PropsType): Promise<Result<undefined, DeleteEventError>> {
    const id = EventId.of(eventId);

    const event = await this.deleteEventRepository.findEvent(userId, id);
    if (!event) {
      return err({ type: "NOT_FOUND" });
    }

    event.delete();

    await this.deleteEventRepository.deleteEvent(event);

    return ok(undefined);
  }
}
