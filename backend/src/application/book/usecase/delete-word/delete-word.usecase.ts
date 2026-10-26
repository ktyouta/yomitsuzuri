import { err, ok, Result } from "neverthrow";
import type { IDeleteWordRepository } from "../../../../domain/book";
import { WordId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";

export type DeleteWordError =
  | { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  wordId: string;
}

/**
 * 気になるワード削除ユースケース
 */
export class DeleteWordUsecase {
  constructor(private readonly deleteWordRepository: IDeleteWordRepository,
  ) { }

  /**
   * 気になるワード削除（物理削除する）
   * @param userId 書籍を所有するユーザーID
   * @param wordId 削除する気になるワードID
   * @returns 成功時は ok。
   * 気になるワードが存在しない（他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みを含む）場合はエラー（何も削除しない）
   * @throws wordId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, wordId }: PropsType): Promise<Result<undefined, DeleteWordError>> {
    const id = WordId.of(wordId);

    const deleted = await this.deleteWordRepository.deleteWord(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
