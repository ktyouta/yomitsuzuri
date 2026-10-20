import { err, ok, type Result } from "neverthrow";
import type { UserId } from "../../../shared";
import { WorkEntity } from "../../entity/work-entity/work-entity";
import { BookId, ReadingStatusId, WorkId, WorkMemo, WorkSort, WorkTitle, type BookMemo, type BookTitle, type CurrentPage, type IconId, type PublishedDate } from "../../value-object";

type CreateBookParamType = {
    userId: UserId;
    title: BookTitle;
    publishedDate: PublishedDate;
    currentPage: CurrentPage;
    memo: BookMemo;
    iconId: IconId;
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
};

type UpdateWorkParamType = {
    id: WorkId | null;
    title: WorkTitle;
    memo: WorkMemo;
    sort: WorkSort;
    iconId: IconId;
    deleteFlg: boolean;
}

type UpdateBookParamType = {
    title: BookTitle;
    publishedDate: PublishedDate;
    readingStatus: ReadingStatusId;
    currentPage: CurrentPage;
    memo: BookMemo;
    iconId: IconId;
    works: UpdateWorkParamType[];
};

/**
 * 作品情報更新時の作品の指定の誤り・不変条件の違反
 */
export type BookValidationError = { type: "DUPLICATE_WORK_ID"; id: string }
    | { type: "NEW_WORK_DELETED" }
    | { type: "DUPLICATE_WORK_TITLE"; title: string }
    | { type: "DUPLICATE_WORK_SORT"; sort: number }
    | { type: "ALL_DELETED"; };

/**
 * 作品情報更新の失敗
 * - WORKS_MISMATCH: 作品の指定が既存の作品と一致しない（画面の表示後に作品が変更された等）
 * - INVALID_WORKS: 作品の指定の誤り・不変条件の違反
 */
export type UpdateWorkError = { type: "WORKS_MISMATCH" }
    | { type: "INVALID_WORKS"; errors: BookValidationError[] };

type UpdateSingleWorkParamType = {
    id: WorkId;
    title: WorkTitle;
    memo: WorkMemo;
    iconId: IconId;
};

/**
 * 作品1件の更新の失敗
 * - WORK_NOT_FOUND: 更新対象の作品が書籍に存在しない、または削除済み
 * - DUPLICATE_WORK_TITLE: 削除されていない他の作品と作品名が重複する
 */
export type UpdateSingleWorkError = { type: "WORK_NOT_FOUND" }
    | { type: "DUPLICATE_WORK_TITLE"; title: string };

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
    works: {
        id: string;
        title: string;
        sort: number;
        memo: string | null;
        iconId: number;
        deleteFlg: boolean;
    }[];
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
            [new WorkEntity(
                WorkId.create(),
                WorkTitle.initial(params.title),
                WorkSort.first(),
                WorkMemo.of(null),
                params.iconId,
                false,
            )]
        );
    }

    /**
     * 書籍更新（書籍情報と、削除済みを含む作品の全件をまとめて置き換える）
     *
     * 事前条件（満たさない場合は throw）:
     * - 書籍が削除されていないこと
     *
     * 作品の指定の誤り（違反はすべて収集して INVALID_WORKS の err で返す。この場合は以降の判定を行わない）:
     * - 作品 ID が重複していること
     * - 新規の作品（id が null）が削除済みであること
     *
     * 作品の指定が既存の作品と一致しない場合（既存の作品が欠けている・既存にない ID が含まれる）は WORKS_MISMATCH を err で返す。
     * 画面の表示後に作品が変更された場合など、利用者が再読み込みで復帰できるため throw にしない。
     *
     * 不変条件（違反はすべて収集して INVALID_WORKS の err で返す）:
     * - 削除されていない作品が1件以上あること
     * - 削除されていない作品同士でタイトルが重複しないこと
     * - 削除されていない作品同士で表示順が重複しないこと
     *
     * 事後条件:
     * - ok の場合: 自身の書籍情報と作品一覧を引数の内容に置き換え、新規の作品に ID を採番する
     * - err の場合: 自身は変更しない
     * @param params 更新後の書籍情報と作品一覧（作品は削除済みを含む全件）
     * @returns 成功時は ok、作品の指定の誤り・不一致・不変条件の違反時はその内容を持つ Result
     * @throws 事前条件を満たさない場合
     */
    update(params: UpdateBookParamType): Result<void, UpdateWorkError> {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
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

        return ok(undefined);
    }

    /**
     * 作品一覧を検証し、置き換え後の作品エンティティを作成する（新規の作品には ID を採番する）
     * err の条件は update を参照
     * @param works 更新後の作品一覧（削除済みを含む全件）
     * @returns 成功時は置き換え後の作品エンティティ、作品の指定の誤り・不一致・不変条件の違反時はその内容を持つ Result
     */
    private replaceWorks(works: UpdateWorkParamType[]): Result<WorkEntity[], UpdateWorkError> {
        // 不一致の判定は作品 ID の重複がないことを前提とするため、先に判定する
        const specErrors = BookAggregate.collectWorkSpecErrors(works);
        if (specErrors.length > 0) {
            return err({ type: "INVALID_WORKS", errors: specErrors });
        }

        // 作品の存在チェック
        if (!this.matchesExistingWorks(works)) {
            return err({ type: "WORKS_MISMATCH" });
        }

        const errors = BookAggregate.collectWorkErrors(works);
        if (errors.length > 0) {
            return err({ type: "INVALID_WORKS", errors });
        }

        return ok(works.map((work) => new WorkEntity(
            work.id ?? WorkId.create(),
            work.title,
            work.sort,
            work.memo,
            work.iconId,
            work.deleteFlg,
        )));
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
        );
    }

    /**
     * 作品の指定の誤り（作品 ID の重複・新規の作品の削除済み指定）をすべて収集する
     * @param works 更新後の作品一覧
     * @returns 誤りの一覧（誤りがなければ空配列）
     */
    private static collectWorkSpecErrors(works: UpdateWorkParamType[]): BookValidationError[] {
        const errors: BookValidationError[] = [];

        for (const id of BookAggregate.findDuplicates(works.flatMap((work) => work.id ? [work.id.value] : []))) {
            errors.push({ type: "DUPLICATE_WORK_ID", id });
        }

        if (works.some((work) => !work.id && work.deleteFlg)) {
            errors.push({ type: "NEW_WORK_DELETED" });
        }

        return errors;
    }

    /**
     * 引数の作品 ID（新規を除く）が、既存の作品 ID と過不足なく一致するか判定する（重複がないことが前提）
     * @param works 更新後の作品一覧
     * @returns 一致する場合は true
     */
    private matchesExistingWorks(works: UpdateWorkParamType[]): boolean {
        const existingIds = new Set(this._works.map((work) => work.id.value));
        const paramIds = works.flatMap((work) => work.id ? [work.id.value] : []);

        return paramIds.length === existingIds.size
            && paramIds.every((id) => existingIds.has(id));
    }

    /**
     * 削除されていない作品について、不変条件の違反をすべて収集する
     * @param works 更新後の作品一覧
     * @returns 違反一覧（違反がなければ空配列）
     */
    private static collectWorkErrors(works: UpdateWorkParamType[]): BookValidationError[] {
        const activeWorks = works.filter((work) => !work.deleteFlg);
        const errors: BookValidationError[] = [];

        if (activeWorks.length === 0) {
            errors.push({ type: "ALL_DELETED" });
        }

        for (const title of BookAggregate.findDuplicates(activeWorks.map((work) => work.title.value))) {
            errors.push({ type: "DUPLICATE_WORK_TITLE", title });
        }

        for (const sort of BookAggregate.findDuplicates(activeWorks.map((work) => work.sort.value))) {
            errors.push({ type: "DUPLICATE_WORK_SORT", sort });
        }

        return errors;
    }

    /**
     * 重複している値を列挙する（重複値ごとに1件）
     * @param values 検査対象の値一覧
     * @returns 重複していた値の一覧
     */
    private static findDuplicates<V>(values: V[]): V[] {
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
            works: this._works.map((work) => ({
                id: work.id.value,
                title: work.title.value,
                sort: work.sort.value,
                memo: work.memo.value,
                iconId: work.iconId.value,
                deleteFlg: work.deleteFlg,
            })),
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
     * err の条件:
     * - WORK_NOT_FOUND: 更新対象の作品が書籍に存在しない、または削除済みであること
     * - DUPLICATE_WORK_TITLE: 削除されていない他の作品と作品名が重複すること
     *
     * 事後条件:
     * - ok の場合: 自身の作品のうち、更新対象の作品だけを引数の内容に置き換える
     * - err の場合: 自身は変更しない
     * @param param 更新対象の作品 ID と更新後の作品情報
     * @returns 成功時は ok、作品が見つからない・作品名が重複する場合はその内容を持つ Result
     * @throws 事前条件を満たさない場合
     */
    updateWork(param: UpdateSingleWorkParamType): Result<void, UpdateSingleWorkError> {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }

        const target = this._works.find((work) => {
            return work.id.value === param.id.value && !work.deleteFlg;
        });

        if (!target) {
            return err({ type: "WORK_NOT_FOUND" });
        }

        const isDuplicate = this._works.some((work) => {
            return work.id.value !== target.id.value && work.title.value === param.title.value && !work.deleteFlg;
        });

        if (isDuplicate) {
            return err({ type: "DUPLICATE_WORK_TITLE", title: param.title.value });
        }

        this._works = this._works.map((work) => {
            return work.id.value === target.id.value ? work.update(param.title, param.memo, param.iconId) : work;
        });

        return ok(undefined);
    }
}