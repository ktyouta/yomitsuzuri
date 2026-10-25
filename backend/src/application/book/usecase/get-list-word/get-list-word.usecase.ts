import { err, ok, type Result } from "neverthrow";
import { WorkId, type IGetListWordRepository, type UserId } from "../../../../domain";
import { GetListWordResultDto } from "../../dto";

export type GetListWordError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  workId: string;
}

/**
 * 気になるワード一覧取得ユースケース
 */
export class GetListWordUsecase {
  constructor(private readonly repository: IGetListWordRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 成功時は作品の気になるワード一覧の DTO（0件の場合は空の一覧）、作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws workId が空の場合（作品・気になるワードは問い合わせない）
   */
  async execute({ userId, workId }: PropsType): Promise<Result<GetListWordResultDto, GetListWordError>> {
    const id = WorkId.of(workId);

    const [work, words] = await Promise.all([
      this.repository.findWork(userId, id),
      this.repository.findWordList(userId, id),
    ]);

    if (!work) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetListWordResultDto(words));
  }
}
