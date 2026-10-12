import { err, ok, type Result } from "neverthrow";
import type { IGetWorkRepository } from "../../../../domain/book";
import { WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { GetWorkResultDto } from "../../dto";

export type GetWorkError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  workId: string;
}

/**
 * 作品詳細取得ユースケース
 */
export class GetWorkUsecase {
  constructor(private readonly repository: IGetWorkRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 成功時は作品の DTO、作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws workId が空の場合（作品は問い合わせない）
   */
  async execute({ userId, workId }: PropsType): Promise<Result<GetWorkResultDto, GetWorkError>> {
    const work = await this.repository.findWork(userId, WorkId.of(workId));
    if (!work) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetWorkResultDto(work));
  }
}
