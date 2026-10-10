import { err, ok, type Result } from "neverthrow";
import { BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, WorkId, WorkMemo, WorkSort, WorkTitle, type BookId, type BookTitleUniquenessDomainService, type BookValidationError, type IconValidityDomainService, type IUpdateBookRepository, type ReadingStatusValidityDomainService, type UserId } from "../../../../domain";
import { UpdateBookResultDto } from "../../dto";

export type UpdateBookError =
    | { type: "DUPLICATE_TITLE" }
    | { type: "NOT_FOUND" }
    | { type: "INVALID_ICON" }
    | { type: "INVALID_READING_STATUS" }
    | { type: "INVALID_WORKS"; errors: BookValidationError[] };

type UpdateBookBody = {
    title: string;
    publishedDate?: string | null;
    readingStatus: number;
    currentPage?: number | null;
    memo?: string | null;
    iconId: number;
    works: {
        id: string | null;
        title: string;
        sort: number;
        memo?: string | null;
        deleteFlg: boolean;
    }[]
};

type PropsType = {
    userId: UserId;
    bookId: BookId;
    body: UpdateBookBody;
}

export class UpdateBookUsecase {

    constructor(private readonly updateBookRepository: IUpdateBookRepository,
        private readonly uniquenessService: BookTitleUniquenessDomainService,
        private readonly iconValidityService: IconValidityDomainService,
        private readonly readingStatusValidityService: ReadingStatusValidityDomainService,) { }

    /**
     * 書籍更新
     * 書籍情報と、書籍に収録された作品（削除済みを含む全件）をまとめて更新する。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 更新対象の書籍ID
     * @param body 書籍・作品の更新内容
     * @returns 成功時は更新後の書籍と作品の DTO（削除済みの作品は含まない）。
     * 書籍が存在しない・アイコンが無効・読書状況が無効・同名書籍が存在する（自身を除く）・作品が不変条件に違反する場合はエラー（いずれも保存しない）
     * @throws body が値オブジェクトの制約や作品更新の事前条件を満たさない場合（保存しない）
     */
    async execute({ userId, bookId, body }: PropsType): Promise<Result<UpdateBookResultDto, UpdateBookError>> {

        // 更新対象の書籍を取得
        const book = await this.updateBookRepository.findBook(userId, bookId);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // アイコンチェック
        const iconId = new IconId(body.iconId);
        if (!(await this.iconValidityService.isValid(iconId))) {
            return err({ type: "INVALID_ICON" });
        }

        // 読書状況チェック
        const readingStatusId = ReadingStatusId.of(body.readingStatus);
        if (!(await this.readingStatusValidityService.isValid(readingStatusId))) {
            return err({ type: "INVALID_READING_STATUS" });
        }

        // 書籍情報更新
        const updatedBook = book.updateBook({
            title: new BookTitle(body.title),
            publishedDate: new PublishedDate(body.publishedDate),
            readingStatus: readingStatusId,
            currentPage: new CurrentPage(body.currentPage),
            memo: new BookMemo(body.memo),
            iconId: iconId
        });

        // タイトルの重複チェック
        if (await this.uniquenessService.isDuplicated(userId, bookId, updatedBook.title)) {
            return err({ type: "DUPLICATE_TITLE" });
        }

        // 作品情報更新
        const updatedWork = updatedBook.updateWork(body.works.map((work) => ({
            id: work.id ? WorkId.of(work.id) : null,
            title: new WorkTitle(work.title),
            memo: new WorkMemo(work.memo),
            sort: WorkSort.of(work.sort),
            deleteFlg: work.deleteFlg,
        })));
        if (updatedWork.isErr()) {
            return err({ type: "INVALID_WORKS", errors: updatedWork.error });
        }

        // 更新
        await this.updateBookRepository.updateBook(updatedWork.value);
        return ok(new UpdateBookResultDto(updatedWork.value));
    };
}