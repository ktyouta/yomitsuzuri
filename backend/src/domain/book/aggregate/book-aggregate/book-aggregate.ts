import { err, ok, type Result } from "neverthrow";
import type { UserId } from "../../../shared";
import { WorkEntity, type WorkSnapshotType } from "../../entity/work-entity/work-entity";
import { BookId, ReadingStatusId, WorkMemo, WorkSort, WorkTitle, type BookMemo, type BookTitle, type CurrentPage, type IconId, type PublishedDate, type WorkId } from "../../value-object";

type CreateBookParamType = {
    userId: UserId;
    title: BookTitle;
    publishedDate: PublishedDate;
    currentPage: CurrentPage;
    memo: BookMemo;
    iconId: IconId;
    /** 作成日時（書籍と、自動で作成する作品の更新日時にする） */
    updatedAt: string;
};

type BookAggregateReconstructParamType = {
    id: BookId;
    userId: UserId;
    title: BookTitle;
    publishedDate: PublishedDate;
    readingStatusId: ReadingStatusId;
    currentPage: CurrentPage;
    memo: BookMemo;
    iconId: IconId;
    deleteFlg: boolean;
    works: WorkEntity[];
    updatedAt: string;
};

type UpdateWorkSortParamType = {
    id: WorkId;
    sort: WorkSort;
}

type UpdateBookParamType = {
    title: BookTitle;
    publishedDate: PublishedDate;
    readingStatus: ReadingStatusId;
    currentPage: CurrentPage;
    memo: BookMemo;
    iconId: IconId;
    works: UpdateWorkSortParamType[];
    /** 画面の表示時点の書籍の更新日時（排他チェックに使う） */
    expectedUpdatedAt: string;
    /** 更新後の書籍の更新日時 */
    updatedAt: string;
};

type UpdateSingleWorkParamType = {
    id: WorkId;
    title: WorkTitle;
    memo: WorkMemo;
    iconId: IconId;
    /** 画面の表示時点の作品の更新日時（排他チェックに使う） */
    expectedUpdatedAt: string;
    /** 更新後の作品の更新日時 */
    updatedAt: string;
};

/**
 * 書籍更新時の作品の指定の誤り・不変条件の違反
 */
export type BookValidationError = { type: "DUPLICATE_WORK_ID"; id: string }
    | { type: "DUPLICATE_WORK_SORT"; sort: number };

/**
 * 書籍更新の失敗
 * - CONFLICT_BOOK: 画面の表示後に、書籍が他の操作で更新された
 * - WORKS_MISMATCH: 作品の指定が既存の作品と一致しない（画面の表示後に作品が追加・削除された等）
 * - INVALID_WORKS: 作品の指定の誤り・不変条件の違反
 */
export type BookUpdateError = { type: "CONFLICT_BOOK" }
    | { type: "WORKS_MISMATCH" }
    | { type: "INVALID_WORKS"; errors: BookValidationError[] };

/**
 * 作品1件の更新の失敗
 * - WORK_NOT_FOUND: 更新対象の作品が書籍に存在しない、または削除済み
 * - CONFLICT_WORK: 画面の表示後に、更新対象の作品が他の操作で更新された
 * - DUPLICATE_WORK_TITLE: 削除されていない他の作品と作品名が重複する
 * - DUPLICATE_DELETED_WORK_TITLE: 削除済みの他の作品とだけ作品名が重複する（復元するか、別の作品名にする必要がある）
 */
export type BookWorkUpdateError = { type: "WORK_NOT_FOUND" }
    | { type: "CONFLICT_WORK" }
    | { type: "DUPLICATE_WORK_TITLE"; title: string }
    | { type: "DUPLICATE_DELETED_WORK_TITLE"; title: string };

type BookSnapshotType = {
    id: string;
    userId: string;
    title: string;
    publishedDate: string | null;
    readingStatusId: number;
    currentPage: number | null;
    memo: string | null;
    iconId: number;
    deleteFlg: boolean;
    works: WorkSnapshotType[];
    updatedAt: string;
}

export class BookAggregate {

    private constructor(private readonly _id: BookId,
        private readonly _userId: UserId,
        private _title: BookTitle,
        private _publishedDate: PublishedDate,
        private _readingStatusId: ReadingStatusId,
        private _currentPage: CurrentPage,
        private _memo: BookMemo,
        private _iconId: IconId,
        private _deleteFlg: boolean,
        private _works: WorkEntity[],
        private _updatedAt: string,
    ) { }

    get id() {
        return this._id;
    }

    get title() {
        return this._title;
    }

    /**
     * 新規登録する書籍集約を作成する
     * 書籍タイトルと同名・書籍と同じアイコンの作品を1件、表示順の先頭として自動で作成する（以降は書籍と連動しない）
     * @param params 書籍の登録内容
     * @returns 読書状況が初期値（未読）の書籍集約
     */
    static create(params: CreateBookParamType): BookAggregate {
        return new BookAggregate(
            BookId.create(),
            params.userId,
            params.title,
            params.publishedDate,
            ReadingStatusId.initial(),
            params.currentPage,
            params.memo,
            params.iconId,
            false,
            [WorkEntity.create({
                title: WorkTitle.initial(params.title),
                sort: WorkSort.first(),
                memo: WorkMemo.of(null),
                iconId: params.iconId,
                updatedAt: params.updatedAt,
            })],
            params.updatedAt,
        );
    }

    /**
     * 書籍更新（書籍情報を置き換え、削除されていない作品の表示順を並び替える。作品の追加・削除・復元と、作品名・メモ・アイコンの変更は行わない）
     * 作品の削除は作品単位の操作で行う（書籍の編集の保存に紛れて、子データごと削除されることを防ぐため。docs/delete-restore/plan.md）
     *
     * 事前条件（満たさない場合は throw）:
     * - 書籍が削除されていないこと
     *
     * 画面の表示時点の書籍の更新日時（params.expectedUpdatedAt）が、自身の更新日時と一致しない場合は CONFLICT_BOOK を err で返す（この場合は以降の判定を行わない）。
     * 作品の更新日時は比較しない（書籍更新は作品の表示順だけを変え、作品単体の更新と変更する項目が重ならないため）。
     *
     * 作品の指定の誤り（違反はすべて収集して INVALID_WORKS の err で返す。この場合は以降の判定を行わない）:
     * - 作品 ID が重複していること
     *
     * 作品の指定が、削除されていない既存の作品と過不足なく一致しない場合（欠けている・既存にない ID が含まれる・削除済みの作品の ID が含まれる）は WORKS_MISMATCH を err で返す。
     * 画面の表示後に作品が変更された場合など、利用者が再読み込みで復帰できるため throw にしない。
     * 削除済みの作品の ID も不一致とするのは、画面の表示後に削除された作品への変更を黙って捨てないため。
     *
     * 不変条件（並び替え後の作品一覧で判定し、違反はすべて収集して INVALID_WORKS の err で返す）:
     * - 表示順を持つ作品同士で表示順が重複しないこと（個別に削除した作品は表示順を持たない。docs/delete-restore/plan.md の U13）
     *
     * 事後条件:
     * - ok の場合: 自身の書籍情報（更新日時を含む）を引数の内容に置き換え、削除されていない作品の表示順だけを引数の内容に置き換える。
     *   作品の表示順以外の値（作品の更新日時を含む）と、削除済みの作品は変更せずに保持する
     * - err の場合: 自身は変更しない
     * @param params 更新後の書籍情報・更新日時、削除されていない作品の ID と表示順の一覧、画面の表示時点の書籍の更新日時
     * @returns 成功時は ok、排他の失敗・作品の指定の誤り・不一致・不変条件の違反時はその内容を持つ Result
     * @throws 事前条件を満たさない場合
     */
    update(params: UpdateBookParamType): Result<void, BookUpdateError> {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }

        // 書籍の排他チェック
        if (this._updatedAt !== params.expectedUpdatedAt) {
            return err({ type: "CONFLICT_BOOK" });
        }

        const works = this.replaceWorks(params.works);
        if (works.isErr()) {
            return err(works.error);
        }

        this._title = params.title;
        this._publishedDate = params.publishedDate;
        this._readingStatusId = params.readingStatus;
        this._currentPage = params.currentPage;
        this._memo = params.memo;
        this._iconId = params.iconId;
        this._works = works.value;
        this._updatedAt = params.updatedAt;

        return ok(undefined);
    }

    /**
     * 作品の表示順の指定を検証し、並び替え後の作品エンティティを作成する
     * err の条件は update を参照
     * @param works 削除されていない作品の ID と、並び替え後の表示順の一覧
     * @returns 成功時は並び替え後の作品エンティティ（削除済みの作品を含む）、作品の指定の誤り・不一致・不変条件の違反時はその内容を持つ Result
     */
    private replaceWorks(works: UpdateWorkSortParamType[]): Result<WorkEntity[], BookUpdateError> {
        // 不一致の判定は作品 ID の重複がないことを前提とするため、先に判定する
        const specErrors = this.collectWorkSpecErrors(works);
        if (specErrors.length > 0) {
            return err({ type: "INVALID_WORKS", errors: specErrors });
        }

        // 作品の存在チェック
        if (!this.matchesExistingWorks(works)) {
            return err({ type: "WORKS_MISMATCH" });
        }

        // 既存の作品 ID は matchesExistingWorks で、削除されていない作品と一致することを確認済み
        const currentWorks = new Map(this._works.map((work) => [work.id.value, work]));
        const newWorks = works.map((work) => {
            const current = currentWorks.get(work.id.value);
            if (!current) {
                throw new Error(`作品の照合に失敗しました。${work.id.value}`);
            }

            return WorkEntity.reconstruct({
                id: work.id,
                title: current.title,
                sort: work.sort,
                memo: current.memo,
                iconId: current.iconId,
                deleteFlg: false,
                updatedAt: current.updatedAt,
            });
        });

        // 削除済みの作品は、そのまま保持する
        newWorks.push(...this._works.filter((work) => work.deleteFlg));

        const errors = this.collectWorkErrors(newWorks);
        if (errors.length > 0) {
            return err({ type: "INVALID_WORKS", errors });
        }

        return ok(newWorks);
    }

    /**
     * 永続化済みの値から書籍集約を復元する
     * @param params 書籍と、書籍に収録された作品の値
     * @returns 渡した値をそのまま保持する書籍集約
     */
    static reconstruct(params: BookAggregateReconstructParamType): BookAggregate {
        return new BookAggregate(
            params.id,
            params.userId,
            params.title,
            params.publishedDate,
            params.readingStatusId,
            params.currentPage,
            params.memo,
            params.iconId,
            params.deleteFlg,
            params.works,
            params.updatedAt,
        );
    }

    /**
     * 作品の指定の誤り（作品 ID の重複）をすべて収集する
     * @param works 更新後の作品一覧
     * @returns 誤りの一覧（誤りがなければ空配列）
     */
    private collectWorkSpecErrors(works: UpdateWorkSortParamType[]): BookValidationError[] {
        const errors: BookValidationError[] = [];

        // 作品ID重複チェック
        for (const id of this.findDuplicates(works.map((work) => work.id.value))) {
            errors.push({ type: "DUPLICATE_WORK_ID", id });
        }

        return errors;
    }

    /**
     * 引数の作品 ID が、削除されていない既存の作品 ID と過不足なく一致するか判定する（重複がないことが前提）
     * 削除済みの作品の ID が含まれる場合は一致しない
     * @param works 更新後の作品一覧
     * @returns 一致する場合は true
     */
    private matchesExistingWorks(works: UpdateWorkSortParamType[]): boolean {
        const existingIds = new Set(this._works.flatMap((work) => !work.deleteFlg ? [work.id.value] : []));
        const paramIds = works.map((work) => work.id.value);

        return paramIds.length === existingIds.size
            && paramIds.every((id) => existingIds.has(id));
    }

    /**
     * 並び替え後の作品一覧について、不変条件の違反をすべて収集する
     * 作品名の重複は判定しない（書籍更新では作品名を変更しないため）
     * @param works 並び替え後の作品一覧（削除済みの作品を含む）
     * @returns 違反一覧（違反がなければ空配列）
     */
    private collectWorkErrors(works: WorkEntity[]): BookValidationError[] {
        const errors: BookValidationError[] = [];

        // 並び順重複チェック
        for (const sort of this.findDuplicates(works.flatMap((work) => work.sort.value !== null ? [work.sort.value] : []))) {
            errors.push({ type: "DUPLICATE_WORK_SORT", sort });
        }

        return errors;
    }

    /**
     * 重複している値を列挙する（重複値ごとに1件）
     * @param values 検査対象の値一覧
     * @returns 重複していた値の一覧
     */
    private findDuplicates<V>(values: V[]): V[] {
        const seen = new Set<V>();
        const duplicated = new Set<V>();

        values.forEach((value) => {
            if (seen.has(value)) {
                duplicated.add(value);
            }
            else {
                seen.add(value);
            }
        });

        return [...duplicated];
    }

    /**
     * スナップショットを作成
     * @returns 書籍と、書籍に収録された作品の値
     */
    toSnapshot(): BookSnapshotType {
        return {
            id: this._id.value,
            userId: this._userId.value,
            title: this._title.value,
            publishedDate: this._publishedDate.value,
            readingStatusId: this._readingStatusId.value,
            currentPage: this._currentPage.value,
            memo: this._memo.value,
            iconId: this._iconId.value,
            deleteFlg: this._deleteFlg,
            works: this._works.map((work) => work.toSnapshot()),
            updatedAt: this._updatedAt,
        };
    }

    /**
     * 書籍削除（自身を削除済みにする）
     * @throws 既に削除済みの書籍の場合
     */
    delete(): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }
        this._deleteFlg = true;
    }

    /**
     * 書籍復元（自身の削除済みを解除する）
     * @throws 削除されていない書籍の場合
     */
    restore(): void {
        if (!this._deleteFlg) {
            throw new Error(`削除されていない書籍です。`);
        }
        this._deleteFlg = false;
    }

    /**
     * 作品1件の更新（作品名・メモ・アイコンを置き換える。表示順・削除フラグと他の作品は変更しない）
     *
     * 事前条件（満たさない場合は throw）:
     * - 書籍が削除されていないこと
     *
     * err の条件（上から順に判定し、該当した時点で返す）:
     * - WORK_NOT_FOUND: 更新対象の作品が書籍に存在しない、または削除済みであること
     * - CONFLICT_WORK: 画面の表示時点の作品の更新日時（param.expectedUpdatedAt）が、更新対象の作品の更新日時と一致しないこと
     *   （作品名の重複より先に判定する。画面の表示後に変わった古い内容をもとに、重複のエラーを返さないため）
     * - DUPLICATE_WORK_TITLE: 削除されていない他の作品と作品名が重複すること（削除済みの作品とも重複する場合を含む）
     * - DUPLICATE_DELETED_WORK_TITLE: 削除済みの他の作品とだけ作品名が重複すること
     *
     * 事後条件:
     * - ok の場合: 自身の作品のうち、更新対象の作品の作品名・メモ・アイコン・更新日時だけを引数の内容に置き換える（書籍の更新日時は変更しない）
     * - err の場合: 自身は変更しない
     * @param param 更新対象の作品 ID、更新後の作品情報・更新日時、画面の表示時点の作品の更新日時
     * @returns 成功時は ok、作品が見つからない・排他の失敗・作品名が重複する場合はその内容を持つ Result
     * @throws 事前条件を満たさない場合
     */
    updateWork(param: UpdateSingleWorkParamType): Result<void, BookWorkUpdateError> {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }

        const target = this._works.find((work) => {
            return work.id.value === param.id.value && !work.deleteFlg;
        });

        if (!target) {
            return err({ type: "WORK_NOT_FOUND" });
        }

        const updated = target.update({
            title: param.title,
            memo: param.memo,
            iconId: param.iconId,
            expectedUpdatedAt: param.expectedUpdatedAt,
            updatedAt: param.updatedAt,
        });
        if (updated.isErr()) {
            return err(updated.error);
        }

        // 削除済みの作品も対象にする（復元したときに重複させないため）
        const duplicates = this._works.filter((work) => {
            return work.id.value !== target.id.value && work.title.value === param.title.value;
        });

        if (duplicates.some((work) => !work.deleteFlg)) {
            return err({ type: "DUPLICATE_WORK_TITLE", title: param.title.value });
        }
        if (duplicates.length > 0) {
            return err({ type: "DUPLICATE_DELETED_WORK_TITLE", title: param.title.value });
        }

        this._works = this._works.map((work) => {
            return work.id.value === target.id.value ? updated.value : work;
        });

        return ok(undefined);
    }
}