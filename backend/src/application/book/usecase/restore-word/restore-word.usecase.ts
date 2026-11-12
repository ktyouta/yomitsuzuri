import { err, ok, Result } from "neverthrow";
import { WordId, type IRestoreWordRepository, type UserId } from "../../../../domain";
import { RestoreWordResultDto } from "../../dto";

export type RestoreWordError =
  { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  wordId: string;
}

/**
 * 気になるワード復元ユースケース
 */
export class RestoreWordUsecase {
  constructor(private readonly restoreWordRepository: IRestoreWordRepository) { }

  /**
   * 気になるワード復元（論理削除を解除する）
   * @param userId 書籍を所有するユーザーID
   * @param wordId 復元する気になるワードID
   * @returns 成功時は復元した気になるワードの DTO。
   * 削除済みの気になるワードが存在しない（削除されていない気になるワード・他ユーザーの書籍の気になるワード・作品または書籍が論理削除済みを含む）場合は NOT_FOUND（保存しない）
   * @throws wordId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, wordId }: PropsType): Promise<Result<RestoreWordResultDto, RestoreWordError>> {
    const id = WordId.of(wordId);

    // 削除済みの気になるワードの存在・所有者チェック
    const word = await this.restoreWordRepository.findWord(userId, id);
    if (!word) {
      return err({ type: "NOT_FOUND" });
    }

    word.restore();

    await this.restoreWordRepository.restoreWord(word);

    return ok(new RestoreWordResultDto(word));
  }
}
