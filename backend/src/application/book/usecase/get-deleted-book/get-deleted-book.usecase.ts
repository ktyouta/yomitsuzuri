import { err, ok, type Result } from "neverthrow";
import { BookId, type IGetDeletedBookRepository, type UserId } from "../../../../domain";
import { GetDeletedBookResultDto } from "../../dto";

export type GetDeletedBookError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  bookId: string;
}

/**
 * 削除済みの書籍詳細（ゴミ箱の詳細）取得ユースケース
 */
export class GetDeletedBookUsecase {
  constructor(private readonly repository: IGetDeletedBookRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 成功時は書籍情報・作品一覧・著者一覧の DTO、書籍が存在しない・他ユーザーの書籍・削除されていない書籍の場合は NOT_FOUND
   * @throws bookId が空の場合（書籍・作品・著者は問い合わせない）
   */
  async execute({ userId, bookId }: PropsType): Promise<Result<GetDeletedBookResultDto, GetDeletedBookError>> {
    const id = BookId.of(bookId);

    const [book, works, authors] = await Promise.all([
      this.repository.findDeletedBook(userId, id),
      this.repository.findDeletedBookWork(userId, id),
      this.repository.findDeletedBookAuthor(userId, id),
    ]);

    if (!book) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetDeletedBookResultDto(book, works, authors));
  }
}
