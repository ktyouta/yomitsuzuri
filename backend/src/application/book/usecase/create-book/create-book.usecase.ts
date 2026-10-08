import { err, ok, type Result } from "neverthrow";
import type { BookTitleUniquenessDomainService, ICreateBookRepository, IconValidityDomainService } from "../../../../domain/book";
import { BookAggregate, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { CreateBookResultDto } from "../../dto";

export type CreateBookError =
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
   * @returns 成功時は作成した書籍と作品の DTO、アイコンが無効・同名書籍が存在する場合はエラー（いずれも保存しない）
   * @throws body が値オブジェクトの制約を満たさない場合（保存しない）
   */
  async execute({ userId, body }: PropsType): Promise<Result<CreateBookResultDto, CreateBookError>> {

    const title = new BookTitle(body.title);
    const publishedDate = new PublishedDate(body.publishedDate);
    const currentPage = new CurrentPage(body.currentPage);
    const memo = new BookMemo(body.memo);
    const iconId = new IconId(body.icon);

    // アイコンの実在・有効性チェック（icon_master が唯一の真実源のため、値オブジェクトではなくここで判定する）
    if (!(await this.iconValidityService.isValid(iconId))) {
      return err({ type: "INVALID_ICON" });
    }

    // 書籍集約（書籍タイトルと同名の作品を1件含む）
    const book = BookAggregate.generate({ userId, title, publishedDate, currentPage, memo, iconId });

    // タイトル重複（bookId は未使用の新規 ID のため自己除外は実質的に無効）
    if (await this.uniquenessService.isDuplicated({ userId, bookId: book.id, bookTitle: title })) {
      return err({ type: "DUPLICATE_TITLE" });
    }

    await this.createBookRepository.createBook(book);

    return ok(new CreateBookResultDto(book));
  }
}
