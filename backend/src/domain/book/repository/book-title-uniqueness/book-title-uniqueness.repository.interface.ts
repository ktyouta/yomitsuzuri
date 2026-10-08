import type { UserId } from "../../../shared";
import type { BookId, BookTitle } from "../../value-object";

/**
 * 書籍タイトル一意性判定リポジトリインターフェース
 */
export interface IBookTitleUniquenessRepository {
    /**
     * 同名書籍の取得（同一ユーザー内・未削除のもの）
     * bookId 自身は判定対象から除外する（更新時の自己重複を防ぐ）。
     * 新規作成では未使用の ID を渡すため、除外は実質的に無効となる。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 判定対象から除外する書籍ID
     * @param bookTitle 書籍タイトル
     * @returns 同名書籍の ID 一覧
     */
    findBook(userId: UserId, bookId: BookId, bookTitle: BookTitle): Promise<{ id: string }[]>;
}
