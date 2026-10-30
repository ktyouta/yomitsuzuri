import { err, ok, type Result } from "neverthrow";
import type { IGetEventRepository } from "../../../../domain/book";
import { EventId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { GetEventResultDto } from "../../dto";

export type GetEventError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  eventId: string;
}

/**
 * 出来事詳細取得ユースケース
 */
export class GetEventUsecase {
  constructor(private readonly repository: IGetEventRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 成功時は出来事の DTO、出来事が存在しない・他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws eventId が空の場合（出来事は問い合わせない）
   */
  async execute({ userId, eventId }: PropsType): Promise<Result<GetEventResultDto, GetEventError>> {
    const event = await this.repository.findEvent(userId, EventId.of(eventId));
    if (!event) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetEventResultDto(event));
  }
}
