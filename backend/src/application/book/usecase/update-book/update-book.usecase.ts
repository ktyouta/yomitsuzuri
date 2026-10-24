import { err, ok, Result } from "neverthrow";
import { BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, WorkId, WorkMemo, WorkSort, WorkTitle, type BookMemoError, type BookTitleError, type BookTitleUniquenessDomainService, type CurrentPageError, type IconIdError, type IconValidityDomainService, type IUpdateBookRepository, type PublishedDateError, type ReadingStatusIdError, type ReadingStatusValidityDomainService, type UpdateWorkError, type UserId, type WorkMemoError, type WorkSortError, type WorkTitleError } from "../../../../domain";
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
    | { field: `works.${number}.title`; error: WorkTitleError }
    | { field: `works.${number}.sort`; error: WorkSortError }
    | { field: `works.${number}.memo`; error: WorkMemoError }
    | { field: `works.${number}.iconId`; error: IconIdError };

export type UpdateBookError =
    | { type: "INVALID_INPUT"; errors: UpdateBookInputError[] }
    | { type: "DUPLICATE_TITLE" }
    | { type: "NOT_FOUND" }
    | { type: "INVALID_ICON" }
    | { type: "INVALID_READING_STATUS" }
    | UpdateWorkError;

type UpdateWorkBody = {
    id: string | null;
    title: string;
    sort: number;
    memo?: string | null;
    iconId: number;
    deleteFlg: boolean;
};

type UpdateBookBody = {
    title: string;
    publishedDate?: string | null;
    readingStatus: number;
    currentPage?: number | null;
    memo?: string | null;
    iconId: number;
    works: UpdateWorkBody[];
};

type PropsType = {
    userId: UserId;
    bookId: string;
    body: UpdateBookBody;
}

/**
 * 作品1件分の入力値から、作品の更新内容を生成する
 * @param work 作品の入力値
 * @param index 作品の添字（制約違反の項目名に使う）
 * @returns 成功時は作品の更新内容、制約違反時は違反の一覧（すべて収集する）
 */
function createWorkParam(work: UpdateWorkBody, index: number) {
    const input = Result.combineWithAllErrors([
        WorkTitle.create(work.title).mapErr((error): UpdateBookInputError => ({ field: `works.${index}.title`, error })),
        WorkSort.create(work.sort).mapErr((error): UpdateBookInputError => ({ field: `works.${index}.sort`, error })),
        WorkMemo.create(work.memo).mapErr((error): UpdateBookInputError => ({ field: `works.${index}.memo`, error })),
        IconId.create(work.iconId).mapErr((error): UpdateBookInputError => ({ field: `works.${index}.iconId`, error })),
    ]);
    if (input.isErr()) {
        return err(input.error);
    }
    const [title, sort, memo, iconId] = input.value;

    // 空の作品IDは新規の作品として扱う。形式は判定せず、存在しない ID は集約の作品の照合で検出する
    const id = work.id ? WorkId.of(work.id) : null;

    return ok({ id, title, memo, sort, iconId, deleteFlg: work.deleteFlg });
}

export class UpdateBookUsecase {

    constructor(private readonly updateBookRepository: IUpdateBookRepository,
        private readonly uniquenessService: BookTitleUniquenessDomainService,
        private readonly iconValidityService: IconValidityDomainService,
        private readonly readingStatusValidityService: ReadingStatusValidityDomainService,) { }

    /**
     * 書籍更新
     * 書籍情報と、書籍に収録された作品をまとめて更新する（既に削除済みの作品は、含まれていても変更しない）。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 更新対象の書籍ID
     * @param body 書籍・作品の更新内容（既に削除済みの作品は含めても含めなくてもよい）
     * @returns 成功時は更新後の書籍と作品の DTO（作品は削除済みを含む）。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・書籍が存在しない・書籍または作品のアイコンが無効・読書状況が無効・同名書籍が存在する（自身を除く）・
     * 作品の指定に誤りがある・作品の指定が既存の作品と一致しない・作品が不変条件に違反する場合はエラー（いずれも保存しない）
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
            Result.combineWithAllErrors(body.works.map(createWorkParam)).mapErr((errors) => errors.flat()),
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

        // アイコンチェック（書籍と作品のアイコンをまとめて確認する）
        const invalidIconIds = await this.iconValidityService.findInvalid([iconId, ...works.map((work) => work.iconId)]);
        if (invalidIconIds.length > 0) {
            return err({ type: "INVALID_ICON" });
        }

        // 読書状況チェック
        if (!(await this.readingStatusValidityService.isValid(readingStatusId))) {
            return err({ type: "INVALID_READING_STATUS" });
        }

        // タイトルの重複チェック
        if (await this.uniquenessService.isDuplicated(userId, id, title)) {
            return err({ type: "DUPLICATE_TITLE" });
        }

        // 書籍・作品情報更新
        const updateResult = book.update({
            title,
            publishedDate,
            readingStatus: readingStatusId,
            currentPage,
            memo,
            iconId,
            works,
        });
        if (updateResult.isErr()) {
            return err(updateResult.error);
        }

        // 更新
        await this.updateBookRepository.updateBook(book);
        return ok(new UpdateBookResultDto(book));
    };
}
