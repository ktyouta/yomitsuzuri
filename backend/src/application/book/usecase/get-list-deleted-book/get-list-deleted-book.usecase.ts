import { BookListPagination, BookListSort, Timestamp, type IGetListDeletedBookRepository, type UserId } from "../../../../domain";
import { GetListDeletedBookResultDto } from "../../dto";

type QueryType = {
  keyword?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  sort?: string;
  page: number;
};

type PropsType = {
  userId: UserId;
  query: QueryType;
}

/**
 * 削除済みの書籍一覧（ゴミ箱）取得ユースケース
 */
export class GetListDeletedBookUsecase {
  // 1ページあたりの最大取得件数（書籍一覧とは独立して変えられるように別に持つ）
  static readonly PAGE_SIZE = 30;

  constructor(private readonly repository: IGetListDeletedBookRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param query 検索条件（日時は From 以上・To 未満で絞り込む。ページ番号は1始まり）
   * @returns 指定ページの削除済みの書籍一覧・全件数・総ページ数（0件の場合は空の一覧）。
   * 検索条件の不正な値はエラーにせず無視する（形式が不正な日時は条件から外し、不正な並び順は既定の並び順（更新日時の降順）、不正なページ番号は1ページ目として扱う）
   */
  async execute({ userId, query }: PropsType): Promise<GetListDeletedBookResultDto> {
    // 検索条件の不正な値は無視する（日時は条件から外し、並び順は既定の並び順、ページ番号は1ページ目にする）
    const deletedBookListQuery = {
      keyword: query.keyword,
      createdAtFrom: !query.createdAtFrom ? undefined : Timestamp.fromInput(query.createdAtFrom).unwrapOr(undefined),
      createdAtTo: !query.createdAtTo ? undefined : Timestamp.fromInput(query.createdAtTo).unwrapOr(undefined),
      updatedAtFrom: !query.updatedAtFrom ? undefined : Timestamp.fromInput(query.updatedAtFrom).unwrapOr(undefined),
      updatedAtTo: !query.updatedAtTo ? undefined : Timestamp.fromInput(query.updatedAtTo).unwrapOr(undefined),
      bookListSort: BookListSort.create(query.sort).unwrapOr(BookListSort.DEFAULT),
      page: BookListPagination.create(query.page).unwrapOr(BookListPagination.FIRST),
    };
    const [list, total] = await Promise.all([
      this.repository.findDeletedBookList(userId, deletedBookListQuery, GetListDeletedBookUsecase.PAGE_SIZE),
      this.repository.countDeletedBook(userId, deletedBookListQuery),
    ]);
    const totalPages = Math.ceil(total / GetListDeletedBookUsecase.PAGE_SIZE);

    return new GetListDeletedBookResultDto(list, total, totalPages);
  }
}
