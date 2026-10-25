import { err, ok, Result } from "neverthrow";
import type { IUpdateWordRepository, WordMemoError, WordPageError, WordTextError, WordTextUniquenessDomainService } from "../../../../domain/book";
import { WordId, WordMemo, WordPage, WordText } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { UpdateWordResultDto } from "../../dto";

/**
 * 気になるワード更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateWordInputError =
  | { field: "text"; error: WordTextError }
  | { field: "memo"; error: WordMemoError }
  | { field: "page"; error: WordPageError };

export type UpdateWordError =
  | { type: "INVALID_INPUT"; errors: UpdateWordInputError[] }
  | { type: "NOT_FOUND" }
  | { type: "DUPLICATE_TEXT" };

type UpdateWordBody = {
  text: string;
  memo?: string | null;
  page?: number | null;
};

type PropsType = {
  userId: UserId;
  wordId: string;
  body: UpdateWordBody;
}

/**
 * 気になるワード更新ユースケース
 */
export class UpdateWordUsecase {
  constructor(private readonly updateWordRepository: IUpdateWordRepository,
    private readonly uniquenessService: WordTextUniquenessDomainService,
  ) { }

  /**
   * 気になるワード更新（ワード・メモ・ページを置き換える。ID・作品・削除フラグは変えない）
   * @param userId 書籍を所有するユーザーID
   * @param wordId 更新する気になるワードID
   * @param body 気になるワードの更新内容
   * @returns 成功時は更新した気になるワードの DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・気になるワードが存在しない（他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みを含む）・
   * 作品内に自身以外の同じワードが存在する場合はエラー（いずれも保存しない）
   * @throws wordId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, wordId, body }: PropsType): Promise<Result<UpdateWordResultDto, UpdateWordError>> {
    const id = WordId.of(wordId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      WordText.create(body.text).mapErr((error): UpdateWordInputError => ({ field: "text", error })),
      WordMemo.create(body.memo).mapErr((error): UpdateWordInputError => ({ field: "memo", error })),
      WordPage.create(body.page).mapErr((error): UpdateWordInputError => ({ field: "page", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [text, memo, page] = input.value;

    // 気になるワードの存在・所有者チェック
    const word = await this.updateWordRepository.findWord(userId, id);
    if (!word) {
      return err({ type: "NOT_FOUND" });
    }

    // 作品内のワード重複（自身は除外する）
    if (await this.uniquenessService.isDuplicated(userId, word.workId, word.id, text)) {
      return err({ type: "DUPLICATE_TEXT" });
    }

    word.update({ text, memo, page });

    await this.updateWordRepository.updateWord(word);

    return ok(new UpdateWordResultDto(word));
  }
}
