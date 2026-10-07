import type { WorkId, WorkMemo, WorkSort, WorkTitle } from "../../value-object";

export class WorkEntity {

    constructor(private readonly _id: WorkId,
        private readonly _title: WorkTitle,
        private readonly _sort: WorkSort,
        private readonly _memo: WorkMemo,
        private readonly _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id.value;
    }

    get title() {
        return this._title.value;
    }

    get sort() {
        return this._sort.value;
    }

    get memo() {
        return this._memo.value;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }
}