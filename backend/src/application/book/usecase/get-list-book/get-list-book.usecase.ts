import { UserId } from "../../../../domain/shared";
import { BookListPagination } from "../../../../domain/book";
import type { IGetListBookRepository } from "../../../../domain/book";
import { GetListBookResultDto } from "../../dto";

/**
 * 書籍一覧取得ユースケース
 */
export class GetListBookUsecase {
  constructor(private readonly repository: IGetListBookRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param page ページ番号（1始まり）
   * @returns 指定ページの書籍一覧・全件数・総ページ数（0件の場合は空の一覧）
   * @throws userId が空、または page が1以上の整数でない場合（一覧は問い合わせない）
   */
  async execute(userId: string, page: number): Promise<GetListBookResultDto> {
    const userIdObj = UserId.of(userId);
    const pagination = new BookListPagination(page);

    const { list, total } = await this.repository.findList(userIdObj, pagination);

    return new GetListBookResultDto(list, total, pagination.totalPages(total));
  }
}
