import { err, ok, type Result } from "neverthrow";
import { BookListPagination, type BookListPaginationError, type IGetListDeletedBookRepository, type UserId } from "../../../../domain";
import { GetListDeletedBookResultDto } from "../../dto";

/**
 * 削除済みの書籍一覧取得の入力値の制約違反（field は入力値の項目名）
 */
export type GetListDeletedBookInputError = { field: "page"; error: BookListPaginationError };

export type GetListDeletedBookError = { type: "INVALID_INPUT"; errors: GetListDeletedBookInputError[] };

type PropsType = {
  userId: UserId;
  page: number;
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
   * @param page ページ番号（1始まり）
   * @returns 成功時は指定ページの削除済みの書籍一覧・全件数・総ページ数（0件の場合は空の一覧）。
   * ページ番号が制約を満たさない場合は INVALID_INPUT（一覧・件数は問い合わせない）
   */
  async execute({ userId, page }: PropsType): Promise<Result<GetListDeletedBookResultDto, GetListDeletedBookError>> {
    // 入力値の制約チェック
    const pagination = BookListPagination.create(page);
    if (pagination.isErr()) {
      return err({ type: "INVALID_INPUT", errors: [{ field: "page", error: pagination.error }] });
    }

    const [list, total] = await Promise.all([
      this.repository.findDeletedBookList(userId, pagination.value, GetListDeletedBookUsecase.PAGE_SIZE),
      this.repository.countDeletedBook(userId),
    ]);
    const totalPages = Math.ceil(total / GetListDeletedBookUsecase.PAGE_SIZE);

    return ok(new GetListDeletedBookResultDto(list, total, totalPages));
  }
}
