import type { UserId } from "../../../shared";
import type { IBookTitleUniquenessRepository } from "../../repository";
import type { BookId, BookTitle } from "../../value-object";

type PropsType = {
    userId: UserId;
    bookId: BookId;
    bookTitle: BookTitle;
}

/**
 * 書籍タイトル一意性判定ドメインサービス
 */
export class BookTitleUniquenessDomainService {

    constructor(private readonly bookTitleUniquenessRepository: IBookTitleUniquenessRepository) { }

    /**
     * 同名書籍の重複判定。
     * bookId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 判定対象から除外する書籍ID
     * @param bookTitle 書籍タイトル
     * @returns 同一ユーザー内に同名の書籍（未削除・bookId 以外）が存在する場合 true
     */
    async isDuplicated({ userId, bookTitle, bookId }: PropsType): Promise<boolean> {
        const result = await this.bookTitleUniquenessRepository.findBook(userId, bookId, bookTitle);
        return result.length > 0;
    }
}
