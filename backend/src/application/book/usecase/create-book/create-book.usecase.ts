import { err, ok, Result } from "neverthrow";
import type { BookMemoError, BookTitleError, BookTitleUniquenessDomainService, CurrentPageError, ICreateBookRepository, IconIdError, IconValidityDomainService, PublishedDateError } from "../../../../domain/book";
import { BookAggregate, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { CreateBookResultDto } from "../../dto";

/**
 * 書籍作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateBookInputError =
  | { field: "title"; error: BookTitleError }
  | { field: "publishedDate"; error: PublishedDateError }
  | { field: "currentPage"; error: CurrentPageError }
  | { field: "memo"; error: BookMemoError }
  | { field: "icon"; error: IconIdError };

export type CreateBookError =
  | { type: "INVALID_INPUT"; errors: CreateBookInputError[] }
  | { type: "DUPLICATE_TITLE" }
  | { type: "INVALID_ICON" };

type CreateBookBody = {
  title: string;
  publishedDate?: string | null;
  currentPage?: number | null;
  memo?: string | null;
  icon: number;
};

type PropsType = {
  userId: UserId;
  body: CreateBookBody;
}

/**
 * 書籍作成ユースケース
 */
export class CreateBookUsecase {
  constructor(private readonly createBookRepository: ICreateBookRepository,
    private readonly uniquenessService: BookTitleUniquenessDomainService,
    private readonly iconValidityService: IconValidityDomainService,
  ) { }

  /**
   * 書籍作成
   * 書籍タイトルと同名の作品を1件、あわせて作成する。
   * @param userId 書籍を所有するユーザーID
   * @param body 書籍の登録内容
   * @returns 成功時は作成した書籍と作品の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・アイコンが無効・同名書籍が存在する場合はエラー（いずれも保存しない）
   */
  async execute({ userId, body }: PropsType): Promise<Result<CreateBookResultDto, CreateBookError>> {

    // 入力値の制約チェック（違反は項目名を付けてすべて収集する）
    const input = Result.combineWithAllErrors([
      BookTitle.create(body.title).mapErr((error): CreateBookInputError => ({ field: "title", error })),
      PublishedDate.create(body.publishedDate).mapErr((error): CreateBookInputError => ({ field: "publishedDate", error })),
      CurrentPage.create(body.currentPage).mapErr((error): CreateBookInputError => ({ field: "currentPage", error })),
      BookMemo.create(body.memo).mapErr((error): CreateBookInputError => ({ field: "memo", error })),
      IconId.create(body.icon).mapErr((error): CreateBookInputError => ({ field: "icon", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [title, publishedDate, currentPage, memo, iconId] = input.value;

    // アイコンの実在・有効性チェック（icon_master が唯一の真実源のため、値オブジェクトではなくここで判定する）
    if (!(await this.iconValidityService.isValid(iconId))) {
      return err({ type: "INVALID_ICON" });
    }

    // 書籍集約（書籍タイトルと同名の作品を1件含む）
    const book = BookAggregate.generate({ userId, title, publishedDate, currentPage, memo, iconId });

    // タイトル重複（bookId は未使用の新規 ID のため自己除外は実質的に無効）
    if (await this.uniquenessService.isDuplicated(userId, book.id, title)) {
      return err({ type: "DUPLICATE_TITLE" });
    }

    await this.createBookRepository.createBook(book);

    return ok(new CreateBookResultDto(book));
  }
}
