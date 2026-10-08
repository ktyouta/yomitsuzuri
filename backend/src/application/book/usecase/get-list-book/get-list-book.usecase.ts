import type { IGetListBookRepository } from "../../../../domain/book";
import { BookListPagination } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { GetListBookResultDto } from "../../dto";

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
   * @returns 指定ページの書籍一覧・全件数・総ページ数（0件の場合は空の一覧）
   * @throws page が1以上の整数でない場合（一覧・件数は問い合わせない）
   */
  async execute(userId: UserId, page: number): Promise<GetListBookResultDto> {
    const pagination = new BookListPagination(page);

    const [list, total] = await Promise.all([
      this.repository.findList(userId, pagination, GetListBookUsecase.PAGE_SIZE),
      this.repository.count(userId),
    ]);
    const totalPages = Math.ceil(total / GetListBookUsecase.PAGE_SIZE);

    return new GetListBookResultDto(list, total, totalPages);
  }
}
