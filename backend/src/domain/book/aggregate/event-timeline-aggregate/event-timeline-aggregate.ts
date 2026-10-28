import { EventEntity } from "../../entity";
import { EventSortOrder, type EventContent, type EventOccurredTiming, type WorkId } from "../../value-object";

type AddEventTimelineParamType = {
    occurredTiming: EventOccurredTiming;
    content: EventContent;
};

type EventTimelineReconstructParamType = {
    workId: WorkId;
    events: EventEntity[];
};

type EventTimelineSnapshotType = {
    id: string;
    workId: string;
    occurredTiming: string | null;
    content: string;
    sortOrder: number;
    deleteFlg: boolean;
}

/**
 * 作品内の出来事の並び（時系列順）
 *
 * 不変条件:
 * - 保持する出来事はすべて自身の作品に属すること
 */
export class EventTimelineAggregate {

    /**
     * @throws 別の作品の出来事が含まれる場合（不変条件違反）
     */
    private constructor(
        private readonly _workId: WorkId,
        private _events: EventEntity[],
    ) {
        const otherWorkEvent = _events.find((event) => event.workId.value !== _workId.value);
        if (otherWorkEvent) {
            throw new Error(`別の作品の出来事が含まれています。workId:${_workId.value} eventId:${otherWorkEvent.id.value}`);
        }
    }

    /**
     * 永続化済みの値から出来事の並びを復元する
     *
     * 事前条件（満たさない場合は throw）:
     * - 出来事がすべて引数の作品に属すること
     * @param params 作品と、作品に属する出来事（削除済みを含む）
     * @returns 渡した値をそのまま保持する出来事の並び
     * @throws 事前条件を満たさない場合（取得処理の不具合）
     */
    static reconstruct(params: EventTimelineReconstructParamType): EventTimelineAggregate {
        return new EventTimelineAggregate(
            params.workId,
            params.events,
        );
    }

    update() {

    }

    /**
     * 出来事を末尾に追加する
     *
     * 事後条件:
     * - 自身の作品に属する、削除されていない出来事を1件追加する
     * - 追加した出来事の時系列順は、既存の出来事（削除済みを含む）の最大値+1とする（既存がなければ先頭）
     * - 既存の出来事は変更しない
     * @param params 追加する出来事の情報
     * @returns 追加した出来事
     */
    add(params: AddEventTimelineParamType): EventEntity {
        const maxSortOrder = this._events.reduce((max, event) => Math.max(max, event.sortOrder.value), EventSortOrder.FIRST - 1);
        const event = EventEntity.create({
            workId: this._workId,
            occurredTiming: params.occurredTiming,
            content: params.content,
            sortOrder: EventSortOrder.of(maxSortOrder + 1),
        });

        this._events = [...this._events, event];

        return event;
    }

    /**
     * スナップショットを作成
     * @returns 保持する出来事（削除済みを含む）の値
     */
    toSnapshot(): EventTimelineSnapshotType[] {
        return this._events.map((event) => event.toSnapshot());
    }
}
