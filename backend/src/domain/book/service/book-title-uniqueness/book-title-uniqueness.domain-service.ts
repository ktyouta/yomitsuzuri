import { err, ok, type Result } from "neverthrow";
import type { UserId } from "../../../shared";
import type { IBookTitleUniquenessRepository } from "../../repository";
import type { BookId, BookTitle } from "../../value-object";

/**
 * 書籍タイトルの一意性の違反
 * - DUPLICATE_TITLE: 削除されていない同名の書籍がある
 * - DUPLICATE_DELETED_TITLE: 削除済みの同名の書籍だけがある（復元するか、別のタイトルにする必要がある）
 */
export type BookTitleUniquenessError =
    | { type: "DUPLICATE_TITLE" }
    | { type: "DUPLICATE_DELETED_TITLE" };

/**
 * 書籍タイトル一意性判定ドメインサービス
 */
export class BookTitleUniquenessDomainService {

    constructor(private readonly bookTitleUniquenessRepository: IBookTitleUniquenessRepository) { }

    /**
     * 書籍タイトルの一意性を検証する。
     * 削除済みの書籍も重複の対象にする（復元したときに重複させないため）。
     * bookId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     *
     * err の条件:
     * - DUPLICATE_TITLE: 同一ユーザー内に、bookId 以外で削除されていない同名の書籍がある（削除済みの同名もある場合を含む）
     * - DUPLICATE_DELETED_TITLE: 同一ユーザー内に、bookId 以外で削除済みの同名の書籍だけがある
     * @param userId 書籍を所有するユーザーID
     * @param bookId 判定対象から除外する書籍ID
     * @param bookTitle 書籍タイトル
     * @returns 同名の書籍がなければ ok、あればその違反を持つ Result
     */
    async validate(userId: UserId, bookId: BookId, bookTitle: BookTitle): Promise<Result<undefined, BookTitleUniquenessError>> {
        const books = await this.bookTitleUniquenessRepository.findBook(userId, bookId, bookTitle);

        if (books.some((book) => !book.deleteFlg)) {
            return err({ type: "DUPLICATE_TITLE" });
        }
        if (books.length > 0) {
            return err({ type: "DUPLICATE_DELETED_TITLE" });
        }

        return ok(undefined);
    }
}
