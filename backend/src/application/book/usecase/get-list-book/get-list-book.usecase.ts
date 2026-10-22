import { err, ok, type Result } from "neverthrow";
import type { BookListPaginationError, IGetListBookRepository } from "../../../../domain/book";
import { BookListPagination } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { GetListBookResultDto } from "../../dto";

/**
 * 書籍一覧取得の入力値の制約違反（field は入力値の項目名）
 */
export type GetListBookInputError = { field: "page"; error: BookListPaginationError };

export type GetListBookError = { type: "INVALID_INPUT"; errors: GetListBookInputError[] };

type PropsType = {
  userId: UserId;
  page: number;
}

/**
 * 書籍一覧取得ユースケース
 */
export class GetListBookUsecase {
  // 1ページあたりの最大取得件数
  static readonly PAGE_SIZE = 30;

  constructor(private readonly repository: IGetListBookRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param page ページ番号（1始まり）
   * @returns 成功時は指定ページの書籍一覧・全件数・総ページ数（0件の場合は空の一覧）。
   * ページ番号が制約を満たさない場合は INVALID_INPUT（一覧・件数は問い合わせない）
   */
  async execute({ userId, page }: PropsType): Promise<Result<GetListBookResultDto, GetListBookError>> {
    // 入力値の制約チェック
    const pagination = BookListPagination.create(page);
    if (pagination.isErr()) {
      return err({ type: "INVALID_INPUT", errors: [{ field: "page", error: pagination.error }] });
    }

    const [list, total] = await Promise.all([
      this.repository.findBookList(userId, pagination.value, GetListBookUsecase.PAGE_SIZE),
      this.repository.countBook(userId),
    ]);
    const totalPages = Math.ceil(total / GetListBookUsecase.PAGE_SIZE);

    return ok(new GetListBookResultDto(list, total, totalPages));
  }
}
