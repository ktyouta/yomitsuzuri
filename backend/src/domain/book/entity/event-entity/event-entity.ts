import { EventId, type EventContent, type EventOccurredTiming, type EventSortOrder, type WorkId } from "../../value-object";

type CreateEventParamType = {
    workId: WorkId;
    occurredTiming: EventOccurredTiming;
    content: EventContent;
    sortOrder: EventSortOrder;
};

type EventReconstructParamType = {
    id: EventId;
    workId: WorkId;
    occurredTiming: EventOccurredTiming;
    content: EventContent;
    sortOrder: EventSortOrder;
    deleteFlg: boolean;
};

type UpdateEventParamType = {
    occurredTiming: EventOccurredTiming;
    content: EventContent;
}

type EventSnapshotType = {
    id: string;
    workId: string;
    occurredTiming: string | null;
    content: string;
    sortOrder: number;
    deleteFlg: boolean;
}

/**
 * 出来事（作品の物語中で起きた出来事）
 *
 * 時系列順は値として持つだけで変更しない（並べ替えは作品内の出来事の並びを扱う集約が担う）
 */
export class EventEntity {

    private constructor(private readonly _id: EventId,
        private readonly _workId: WorkId,
        private _occurredTiming: EventOccurredTiming,
        private _content: EventContent,
        private readonly _sortOrder: EventSortOrder,
        private readonly _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get workId() {
        return this._workId;
    }

    get occurredTiming() {
        return this._occurredTiming;
    }

    get content() {
        return this._content;
    }

    get sortOrder() {
        return this._sortOrder;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 出来事作成
     * @param params 作成する出来事の情報
     * @returns 新しい ID を採番した、削除されていない出来事
     */
    static create(params: CreateEventParamType) {
        return new EventEntity(
            EventId.create(),
            params.workId,
            params.occurredTiming,
            params.content,
            params.sortOrder,
            false
        );
    }

    /**
     * 永続化済みの値から出来事を復元する
     * @param params 永続化済みの出来事の情報
     * @returns 引数の値をそのまま持つ出来事
     */
    static reconstruct(params: EventReconstructParamType) {
        return new EventEntity(
            params.id,
            params.workId,
            params.occurredTiming,
            params.content,
            params.sortOrder,
            params.deleteFlg,
        );
    }

    /**
     * 出来事更新（ID・作品・時系列順・削除フラグ以外の項目を置き換える）
     *
     * 事前条件（満たさない場合は throw）:
     * - 出来事が削除されていないこと
     *
     * 事後条件:
     * - 自身の発生タイミング・内容を引数の内容に置き換える
     * @param params 更新後の出来事情報
     * @throws 事前条件を満たさない場合
     */
    update(params: UpdateEventParamType): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの出来事です。`);
        }

        this._occurredTiming = params.occurredTiming;
        this._content = params.content;
    }

    /**
     * スナップショットを作成
     * @returns 出来事の値
     */
    toSnapshot(): EventSnapshotType {
        return {
            id: this._id.value,
            workId: this._workId.value,
            occurredTiming: this._occurredTiming.value,
            content: this._content.value,
            sortOrder: this._sortOrder.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
