import { err, ok, type Result } from "neverthrow";
import type { IGetBookRepository } from "../../../../domain/book";
import { BookId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { GetBookResultDto } from "../../dto";

export type GetBookError = { type: "NOT_FOUND" };

/**
 * 書籍詳細取得ユースケース
 */
export class GetBookUsecase {
  constructor(private readonly repository: IGetBookRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 成功時は書籍情報と作品一覧の DTO、書籍が存在しない・他ユーザーの書籍・論理削除済みの場合は NOT_FOUND
   * @throws bookId が空の場合（書籍・作品は問い合わせない）
   */
  async execute(userId: UserId, bookId: string): Promise<Result<GetBookResultDto, GetBookError>> {
    const id = BookId.of(bookId);

    const [book, works] = await Promise.all([
      this.repository.findBook(userId, id),
      this.repository.findWork(userId, id),
    ]);

    if (!book) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetBookResultDto(book, works));
  }
}
