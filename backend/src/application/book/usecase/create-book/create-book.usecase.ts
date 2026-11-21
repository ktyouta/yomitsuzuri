import { err, ok, Result } from "neverthrow";
import { AuthorName, BookAggregate, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, Timestamp, type AuthorNameError, type BookCreateError, type BookMemoError, type BookTitleError, type BookTitleUniquenessDomainService, type BookTitleUniquenessError, type CurrentPageError, type IconIdError, type IconValidityDomainService, type ICreateBookRepository, type PublishedDateError, type UserId } from "../../../../domain";
import { CreateBookResultDto } from "../../dto";

/**
 * 書籍作成の入力値の制約違反（field は入力値の項目名。著者は `authorNames.{著者の添字}.name`）
 */
export type CreateBookInputError =
  | { field: "title"; error: BookTitleError }
  | { field: "publishedDate"; error: PublishedDateError }
  | { field: "currentPage"; error: CurrentPageError }
  | { field: "memo"; error: BookMemoError }
  | { field: "iconId"; error: IconIdError }
  | { field: `authorNames.${number}.name`; error: AuthorNameError };

export type CreateBookError =
  | { type: "INVALID_INPUT"; errors: CreateBookInputError[] }
  | BookTitleUniquenessError
  | { type: "INVALID_ICON" }
  | BookCreateError;

type CreateAuthorBody = {
  name: string;
};

type CreateBookBody = {
  title: string;
  publishedDate?: string | null;
  currentPage?: number | null;
  memo?: string | null;
  iconId: number;
  authorNames: CreateAuthorBody[];
};

type PropsType = {
  userId: UserId;
  body: CreateBookBody;
}

/**
 * 著者の入力値から、著者名の一覧を生成する（空欄・空白のみの著者は省く）
 * @param authors 著者の入力値
 * @returns 成功時は入力順の著者名、制約違反時は違反すべて（項目名の添字は、空欄を省く前の位置）
 */
function createAuthorNames(authors: CreateAuthorBody[]) {
  return Result.combineWithAllErrors(
    authors.flatMap((author, index) => {
      if (!author.name.trim()) {
        return [];
      }
      return [AuthorName.create(author.name).mapErr((error): CreateBookInputError => ({ field: `authorNames.${index}.name`, error }))];
    }),
  );
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
   * 書籍タイトルと同名・書籍と同じアイコンの作品を1件、あわせて作成する。
   * 著者は入力順に表示順を振って作成する。著者名が空欄・空白のみの著者は、エラーにせず省く。
   * @param userId 書籍を所有するユーザーID
   * @param body 書籍の登録内容
   * @returns 成功時は作成した書籍と作品の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・アイコンが無効・著者名が重複する（DUPLICATE_AUTHOR_NAME）・同名書籍が存在する（削除済みを含む。削除済みだけの場合は DUPLICATE_DELETED_TITLE）場合はエラー（いずれも保存しない）
   */
  async execute({ userId, body }: PropsType): Promise<Result<CreateBookResultDto, CreateBookError>> {

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      Result.combineWithAllErrors([
        BookTitle.create(body.title).mapErr((error): CreateBookInputError => ({ field: "title", error })),
        PublishedDate.create(body.publishedDate).mapErr((error): CreateBookInputError => ({ field: "publishedDate", error })),
        CurrentPage.create(body.currentPage).mapErr((error): CreateBookInputError => ({ field: "currentPage", error })),
        BookMemo.create(body.memo).mapErr((error): CreateBookInputError => ({ field: "memo", error })),
        IconId.create(body.iconId).mapErr((error): CreateBookInputError => ({ field: "iconId", error })),
      ]),
      createAuthorNames(body.authorNames),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error.flat() });
    }
    const [[title, publishedDate, currentPage, memo, iconId], authorNames] = input.value;

    // アイコンの実在・有効性チェック（icon_master が唯一の真実源のため、値オブジェクトではなくここで判定する）
    if (!(await this.iconValidityService.isValid(iconId))) {
      return err({ type: "INVALID_ICON" });
    }

    // 書籍集約（書籍タイトルと同名の作品を1件含む）
    const created = BookAggregate.create({ userId, title, publishedDate, currentPage, memo, iconId, updatedAt: Timestamp.create(), authorNames });
    if (created.isErr()) {
      return err(created.error);
    }
    const book = created.value;

    // タイトル重複
    const uniqueness = await this.uniquenessService.validate(userId, book.id, title);
    if (uniqueness.isErr()) {
      return err(uniqueness.error);
    }

    await this.createBookRepository.createBook(book);

    return ok(new CreateBookResultDto(book));
  }
}
