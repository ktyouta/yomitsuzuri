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

type UpdateBookParamType = {
    title: BookTitle;
    publishedDate: PublishedDate;
    readingStatus: ReadingStatusId;
    currentPage: CurrentPage;
    memo: BookMemo;
    iconId: IconId;
};

type UpdateWorkParamType = {
    id: WorkId | null;
    title: WorkTitle;
    memo: WorkMemo;
    sort: WorkSort;
    deleteFlg: boolean;
}

/**
 * 作品情報更新時の不変条件の違反
 */
export type BookValidationError = { type: "DUPLICATE_WORK_TITLE"; title: string }
    | { type: "DUPLICATE_WORK_SORT"; sort: number }
    | { type: "ALL_DELETED"; };

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
        deleteFlg: boolean;
    }[];
}

export class BookAggregate {

    private constructor(private readonly _id: BookId,
        private readonly _userId: UserId,
        private readonly _title: BookTitle,
        private readonly _publishedDate: PublishedDate,
        private readonly _readingStatusId: ReadingStatusId,
        private readonly _currentPage: CurrentPage,
        private readonly _memo: BookMemo,
        private readonly _iconId: IconId,
        private readonly _deleteFlg: boolean,
        private readonly _works: WorkEntity[],
    ) { }

    get id() {
        return this._id;
    }

    get title() {
        return this._title.value;
    }

    /**
     * 新規登録する書籍集約を作成する
     * 書籍タイトルと同名の作品を1件、表示順の先頭として自動で作成する
     * @param params 書籍の登録内容
     * @returns 読書状況が初期値（未読）の書籍集約
     */
    static generate(params: CreateBookParamType): BookAggregate {
        return new BookAggregate(
            BookId.generate(),
            params.userId,
            params.title,
            params.publishedDate,
            ReadingStatusId.initial(),
            params.currentPage,
            params.memo,
            params.iconId,
            false,
            [new WorkEntity(
                WorkId.generate(),
                new WorkTitle(params.title.value),
                WorkSort.first(),
                new WorkMemo(null),
                false,
            )]
        );
    }

    /**
     * 書籍情報更新
     * @param params 
     */
    updateBook(params: UpdateBookParamType): BookAggregate {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }
        return new BookAggregate(
            this._id,
            this._userId,
            params.title,
            params.publishedDate,
            params.readingStatus,
            params.currentPage,
            params.memo,
            params.iconId,
            false,
            this._works,
        );
    }

    /**
     * 作品情報更新（削除済みを含む全件を渡して置き換える）
     *
     * 事前条件（満たさない場合は throw）:
     * - 書籍が削除されていないこと
     * - 既存の作品をすべて、ID を重複させずに含めること（既存にない ID は含めない）
     * - 新規の作品（id が null）が削除済みでないこと
     *
     * 不変条件（違反はすべて収集して err で返し、作品は変更しない）:
     * - 削除されていない作品が1件以上あること
     * - 削除されていない作品同士でタイトルが重複しないこと
     * - 削除されていない作品同士で表示順が重複しないこと
     *
     * 事後条件（ok の場合）: 作品一覧を引数の内容に置き換え、新規の作品に ID を採番した集約を返す（自身は変更しない）
     * @param works 更新後の作品一覧（削除済みを含む全件）
     * @returns 成功時は更新後の書籍集約、不変条件の違反時は違反一覧を持つ Result
     * @throws 事前条件を満たさない場合
     */
    updateWork(works: UpdateWorkParamType[]): Result<BookAggregate, BookValidationError[]> {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }

        if (!this.isAllExistingWorksIncluded(works)) {
            throw new Error(`作品の指定が既存の作品と一致しません。`);
        }

        if (works.some((work) => !work.id && work.deleteFlg)) {
            throw new Error(`新規の作品を削除済みにすることはできません。`);
        }

        const errors = BookAggregate.collectWorkErrors(works);
        if (errors.length > 0) {
            return err(errors);
        }

        return ok(new BookAggregate(
            this._id,
            this._userId,
            this._title,
            this._publishedDate,
            this._readingStatusId,
            this._currentPage,
            this._memo,
            this._iconId,
            this._deleteFlg,
            works.map((work) => {
                const workId = work.id ?? WorkId.generate();
                return new WorkEntity(
                    workId,
                    work.title,
                    work.sort,
                    work.memo,
                    work.deleteFlg
                );
            }),
        ));
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
     * 引数の作品 ID（新規を除く）が、既存の作品 ID と過不足・重複なく一致するか判定する
     * @param works 更新後の作品一覧
     * @returns 一致する場合は true
     */
    private isAllExistingWorksIncluded(works: UpdateWorkParamType[]): boolean {
        const existingIds = new Set(this._works.map((work) => work.id));
        const paramIds = works.flatMap((work) => work.id ? [work.id.value] : []);

        return paramIds.length === existingIds.size
            && new Set(paramIds).size === paramIds.length
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
                id: work.id,
                title: work.title,
                sort: work.sort,
                memo: work.memo,
                deleteFlg: work.deleteFlg,
            })),
        };
    }

    /**
     * 書籍削除
     * @returns 削除済みにした書籍集約（自身は変更しない）
     * @throws 既に削除済みの書籍の場合
     */
    delete(): BookAggregate {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }
        return this.withDeleteFlg(true);
    }

    /**
     * 書籍復元
     * @returns 削除済みを解除した書籍集約（自身は変更しない）
     * @throws 削除されていない書籍の場合
     */
    restore(): BookAggregate {
        if (!this._deleteFlg) {
            throw new Error(`削除されていない書籍です。`);
        }
        return this.withDeleteFlg(false);
    }

    /**
     * 削除フラグだけを差し替えた書籍集約を作成する
     * @param deleteFlg 削除フラグ
     * @returns 削除フラグ以外は自身と同じ値を持つ書籍集約
     */
    private withDeleteFlg(deleteFlg: boolean): BookAggregate {
        return new BookAggregate(
            this._id,
            this._userId,
            this._title,
            this._publishedDate,
            this._readingStatusId,
            this._currentPage,
            this._memo,
            this._iconId,
            deleteFlg,
            this._works,
        );
    }
}