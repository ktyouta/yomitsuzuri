import { err, ok, type Result } from "neverthrow";
import { WorkId, type IGetListCharacterRelationRepository, type UserId } from "../../../../domain";
import { GetListCharacterRelationResultDto } from "../../dto";

export type GetListCharacterRelationError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  workId: string;
}

/**
 * 登場人物関係一覧取得ユースケース
 */
export class GetListCharacterRelationUsecase {
  constructor(private readonly repository: IGetListCharacterRelationRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 成功時は作品の登場人物関係一覧の DTO（0件の場合は空の一覧）、作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws workId が空の場合（作品・関係は問い合わせない）
   */
  async execute({ userId, workId }: PropsType): Promise<Result<GetListCharacterRelationResultDto, GetListCharacterRelationError>> {
    const id = WorkId.of(workId);

    const [work, relations] = await Promise.all([
      this.repository.findWork(userId, id),
      this.repository.findCharacterRelationList(userId, id),
    ]);

    if (!work) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetListCharacterRelationResultDto(relations));
  }
}
