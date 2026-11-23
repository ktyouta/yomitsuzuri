import { err, ok, Result } from "neverthrow";
import { WordId, type IHardDeleteWordRepository, type UserId } from "../../../../domain";

export type HardDeleteWordError =
  { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  wordId: string;
}

/**
 * 気になるワードの物理削除ユースケース
 */
export class HardDeleteWordUsecase {
  constructor(private readonly hardDeleteWordRepository: IHardDeleteWordRepository) { }

  /**
   * 気になるワードの物理削除
   * 論理削除済みの気になるワードを物理削除する。
   * @param userId 書籍を所有するユーザーID
   * @param wordId 物理削除の対象の気になるワードID
   * @returns 成功時は ok。
   * 削除済みの気になるワードが存在しない（削除されていない気になるワード・他ユーザーの書籍の気になるワードを含む）場合は NOT_FOUND（削除しない）
   * @throws wordId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, wordId }: PropsType): Promise<Result<undefined, HardDeleteWordError>> {
    const id = WordId.of(wordId);

    // 物理削除（削除済みの気になるワードの存在・所有者は削除の条件で確認する）
    const deleted = await this.hardDeleteWordRepository.deleteWord(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
