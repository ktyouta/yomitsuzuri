import { err, ok, Result } from "neverthrow";
import type { ICreateWordRepository, WordMemoError, WordPageError, WordTextError, WordTextUniquenessDomainService } from "../../../../domain/book";
import { WordEntity, WordMemo, WordPage, WordText, WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { CreateWordResultDto } from "../../dto";

/**
 * 気になるワード作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateWordInputError =
  | { field: "text"; error: WordTextError }
  | { field: "memo"; error: WordMemoError }
  | { field: "page"; error: WordPageError };

export type CreateWordError =
  | { type: "INVALID_INPUT"; errors: CreateWordInputError[] }
  | { type: "NOT_FOUND" }
  | { type: "DUPLICATE_TEXT" };

type CreateWordBody = {
  text: string;
  memo?: string | null;
  page?: number | null;
};

type PropsType = {
  userId: UserId;
  workId: string;
  body: CreateWordBody;
}

/**
 * 気になるワード作成ユースケース
 */
export class CreateWordUsecase {
  constructor(private readonly createWordRepository: ICreateWordRepository,
    private readonly uniquenessService: WordTextUniquenessDomainService,
  ) { }

  /**
   * 気になるワード作成
   * @param userId 書籍を所有するユーザーID
   * @param workId 気になるワードを追加する作品ID
   * @param body 気になるワードの登録内容
   * @returns 成功時は作成した気になるワードの DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・作品が存在しない（他ユーザーの書籍の作品・作品または書籍が論理削除済みを含む）・
   * 作品内に同じワードが存在する場合はエラー（いずれも保存しない）
   * @throws workId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, workId, body }: PropsType): Promise<Result<CreateWordResultDto, CreateWordError>> {
    const id = WorkId.of(workId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      WordText.create(body.text).mapErr((error): CreateWordInputError => ({ field: "text", error })),
      WordMemo.create(body.memo).mapErr((error): CreateWordInputError => ({ field: "memo", error })),
      WordPage.create(body.page).mapErr((error): CreateWordInputError => ({ field: "page", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [text, memo, page] = input.value;

    // 作品の存在・所有者チェック
    if (!(await this.createWordRepository.findWork(userId, id))) {
      return err({ type: "NOT_FOUND" });
    }

    const word = WordEntity.create({ workId: id, text, memo, page });

    // 作品内のワード重複
    if (await this.uniquenessService.isDuplicated(userId, id, word.id, text)) {
      return err({ type: "DUPLICATE_TEXT" });
    }

    await this.createWordRepository.createWord(word);

    return ok(new CreateWordResultDto(word));
  }
}
