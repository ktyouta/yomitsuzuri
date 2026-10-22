import { err, ok, type Result } from "neverthrow";
import type { IGetListCharacterRepository } from "../../../../domain/book";
import { WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { GetListCharacterResultDto } from "../../dto";

export type GetListCharacterError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  workId: string;
}

/**
 * 登場人物一覧取得ユースケース
 */
export class GetListCharacterUsecase {
  constructor(private readonly repository: IGetListCharacterRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 成功時は作品の登場人物一覧の DTO（0件の場合は空の一覧）、作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws workId が空の場合（作品・登場人物は問い合わせない）
   */
  async execute({ userId, workId }: PropsType): Promise<Result<GetListCharacterResultDto, GetListCharacterError>> {
    const id = WorkId.of(workId);

    const [work, characters] = await Promise.all([
      this.repository.findWork(userId, id),
      this.repository.findCharacterList(userId, id),
    ]);

    if (!work) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetListCharacterResultDto(characters));
  }
}
