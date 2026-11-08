import { err, ok, Result } from "neverthrow";
import { BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, WorkId, WorkSort, type BookMemoError, type BookTitleError, type BookTitleUniquenessDomainService, type BookTitleUniquenessError, type BookUpdateError, type CurrentPageError, type IconIdError, type IconValidityDomainService, type IUpdateBookRepository, type PublishedDateError, type ReadingStatusIdError, type ReadingStatusValidityDomainService, type UserId, type WorkSortError } from "../../../../domain";
import { UpdateBookResultDto } from "../../dto";

/**
 * 書籍更新の入力値の制約違反（field は入力値の項目名。作品は `works.{作品の添字}.{項目名}`）
 */
export type UpdateBookInputError =
    | { field: "title"; error: BookTitleError }
    | { field: "publishedDate"; error: PublishedDateError }
    | { field: "readingStatus"; error: ReadingStatusIdError }
    | { field: "currentPage"; error: CurrentPageError }
    | { field: "memo"; error: BookMemoError }
    | { field: "iconId"; error: IconIdError }
    | { field: `works.${number}.sort`; error: WorkSortError };

export type UpdateBookError =
    | { type: "INVALID_INPUT"; errors: UpdateBookInputError[] }
    | BookTitleUniquenessError
    | { type: "NOT_FOUND" }
    | { type: "INVALID_ICON" }
    | { type: "INVALID_READING_STATUS" }
    | BookUpdateError;

type UpdateWorkBody = {
    id: string;
    sort: number;
};

type UpdateBookBody = {
    title: string;
    publishedDate?: string | null;
    readingStatus: number;
    currentPage?: number | null;
    memo?: string | null;
    iconId: number;
    works: UpdateWorkBody[];
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    bookId: string;
    body: UpdateBookBody;
}

/**
 * 作品1件分の入力値から、作品の並び替えの内容を生成する
 * @param work 作品の入力値
 * @param index 作品の添字（制約違反の項目名に使う）
 * @returns 成功時は作品の並び替えの内容、制約違反時はその内容
 */
function createWorkParam(work: UpdateWorkBody, index: number) {
    const sort = WorkSort.create(work.sort).mapErr((error): UpdateBookInputError => ({ field: `works.${index}.sort`, error }));
    if (sort.isErr()) {
        return err(sort.error);
    }

    // 形式は判定せず、存在しない ID は集約の作品の照合で検出する
    return ok({ id: WorkId.of(work.id), sort: sort.value });
}

export class UpdateBookUsecase {

    constructor(private readonly updateBookRepository: IUpdateBookRepository,
        private readonly uniquenessService: BookTitleUniquenessDomainService,
        private readonly iconValidityService: IconValidityDomainService,
        private readonly readingStatusValidityService: ReadingStatusValidityDomainService,) { }

    /**
     * 書籍更新
     * 書籍情報を更新し、書籍に収録された削除されていない作品の表示順を並び替える（作品の追加・削除・復元と、作品名・メモ・アイコンの変更は行わない）。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 更新対象の書籍ID
     * @param body 書籍の更新内容、削除されていない作品の ID と表示順（削除済みの作品を含めると WORKS_MISMATCH）、画面の表示時点の書籍の更新日時
     * @returns 成功時は更新後の書籍と作品の DTO（作品は削除済みを含む）。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・書籍が存在しない・書籍のアイコンが無効・読書状況が無効・同名書籍が存在する（自身を除き、削除済みを含む。削除済みだけの場合は DUPLICATE_DELETED_TITLE）・
     * 画面の表示後に書籍が更新された（保存時に更新されていた場合を含む）・作品の指定に誤りがある・作品の指定が既存の作品と一致しない・作品が不変条件に違反する場合はエラー（いずれも保存しない）
     * @throws bookId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, bookId, body }: PropsType): Promise<Result<UpdateBookResultDto, UpdateBookError>> {
        const id = BookId.of(bookId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            Result.combineWithAllErrors([
                BookTitle.create(body.title).mapErr((error): UpdateBookInputError => ({ field: "title", error })),
                PublishedDate.create(body.publishedDate).mapErr((error): UpdateBookInputError => ({ field: "publishedDate", error })),
                ReadingStatusId.create(body.readingStatus).mapErr((error): UpdateBookInputError => ({ field: "readingStatus", error })),
                CurrentPage.create(body.currentPage).mapErr((error): UpdateBookInputError => ({ field: "currentPage", error })),
                BookMemo.create(body.memo).mapErr((error): UpdateBookInputError => ({ field: "memo", error })),
                IconId.create(body.iconId).mapErr((error): UpdateBookInputError => ({ field: "iconId", error })),
            ]),
            Result.combineWithAllErrors(body.works.map(createWorkParam)),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error.flat() });
        }
        const [[title, publishedDate, readingStatusId, currentPage, memo, iconId], works] = input.value;

        // 更新対象の書籍を取得
        const book = await this.updateBookRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // アイコンチェック
        const invalidIconIds = await this.iconValidityService.findInvalid([iconId]);
        if (invalidIconIds.length > 0) {
            return err({ type: "INVALID_ICON" });
        }

        // 読書状況チェック
        if (!(await this.readingStatusValidityService.isValid(readingStatusId))) {
            return err({ type: "INVALID_READING_STATUS" });
        }

        // タイトルの重複チェック
        const uniqueness = await this.uniquenessService.validate(userId, id, title);
        if (uniqueness.isErr()) {
            return err(uniqueness.error);
        }

        // 書籍情報更新・作品の並び替え
        const updateResult = book.update({
            title,
            publishedDate,
            readingStatus: readingStatusId,
            currentPage,
            memo,
            iconId,
            works,
            expectedUpdatedAt: body.updatedAt,
            updatedAt: new Date().toISOString(),
        });
        if (updateResult.isErr()) {
            return err(updateResult.error);
        }

        // 更新（取得後に他の操作で更新されていた場合は保存されない）
        const saved = await this.updateBookRepository.updateBook(book, body.updatedAt);
        if (!saved) {
            return err({ type: "CONFLICT_BOOK" });
        }

        return ok(new UpdateBookResultDto(book));
    };
}
