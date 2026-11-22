import { err, ok, type Result } from "neverthrow";
import { BookId, type IGetBookRepository, type UserId } from "../../../../domain";
import { GetBookResultDto } from "../../dto";

export type GetBookError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  bookId: string;
}

/**
 * 書籍詳細取得ユースケース
 */
export class GetBookUsecase {
  constructor(private readonly repository: IGetBookRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 成功時は書籍情報・作品一覧・著者一覧の DTO、書籍が存在しない・他ユーザーの書籍・論理削除済みの場合は NOT_FOUND
   * @throws bookId が空の場合（書籍・作品・著者は問い合わせない）
   */
  async execute({ userId, bookId }: PropsType): Promise<Result<GetBookResultDto, GetBookError>> {
    const id = BookId.of(bookId);

    const [book, works, authors] = await Promise.all([
      this.repository.findBook(userId, id),
      this.repository.findWork(userId, id),
      this.repository.findAuthor(userId, id),
    ]);

    if (!book) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetBookResultDto(book, works, authors));
  }
}
