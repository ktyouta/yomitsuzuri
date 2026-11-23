import { err, ok, Result } from "neverthrow";
import { BookId, Timestamp, type IHardDeleteBookRepository, type TimestampError, type UserId } from "../../../../domain";

/**
 * 書籍の物理削除の入力値の制約違反（field は入力値の項目名）
 */
export type HardDeleteBookInputError =
    { field: "updatedAt"; error: TimestampError };

export type HardDeleteBookError =
    | { type: "NOT_FOUND" }
    | { type: "CONFLICT_BOOK" }
    | { type: "INVALID_INPUT"; errors: HardDeleteBookInputError[] }

type HardDeleteBookBody = {
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    bookId: string;
    body: HardDeleteBookBody;
}

/**
 * 書籍の物理削除ユースケース
 */
export class HardDeleteBookUsecase {

    constructor(private readonly hardDeleteBookRepository: IHardDeleteBookRepository) { }

    /**
     * 書籍の物理削除
     * 論理削除済みの書籍と、書籍の著者・作品・作品の配下をすべて物理削除する。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 物理削除の対象の書籍ID
     * @param body 画面の表示時点の書籍の更新日時
     * @returns 成功時は ok。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
     * 書籍が存在しない（他ユーザーの書籍・削除されていない書籍を含む）場合は NOT_FOUND、
     * 画面の表示後に書籍が復元・更新された（削除時に更新されていた場合を含む）場合は CONFLICT_BOOK（いずれも削除しない）
     * @throws bookId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, bookId, body }: PropsType): Promise<Result<undefined, HardDeleteBookError>> {
        const id = BookId.of(bookId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            Timestamp.fromInput(body.updatedAt).mapErr((error): HardDeleteBookInputError => ({ field: "updatedAt", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error.flat() });
        }
        const [expectedUpdatedAt] = input.value;

        // 物理削除の対象の書籍を取得
        const book = await this.hardDeleteBookRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }
        if (!book.updatedAt.equals(expectedUpdatedAt)) {
            return err({ type: "CONFLICT_BOOK" });
        }

        // 物理削除（取得後に他の操作で復元・更新されていた場合は削除されない）
        const deleted = await this.hardDeleteBookRepository.deleteBook(id, expectedUpdatedAt);
        if (!deleted) {
            return err({ type: "CONFLICT_BOOK" });
        }

        return ok(undefined);
    };
}
