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
}

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
        private _deleteFlg: boolean,
        private readonly _works: WorkEntity[],
    ) { }

    get id() {
        return this._id.value;
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
     * 作品情報更新
     * @param works 
     */
    updateWork(works: UpdateWorkParamType[]) {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }

        const newWorks: WorkEntity[] = [];

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
            })),
        };
    }

    /**
     * 書籍削除
     */
    delete() {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの書籍です。`);
        }
        this._deleteFlg = true;
    }

    /**
     * 書籍復元
     */
    restore() {
        if (!this._deleteFlg) {
            throw new Error(`削除されていない書籍です。`);
        }
        this._deleteFlg = false;
    }
}