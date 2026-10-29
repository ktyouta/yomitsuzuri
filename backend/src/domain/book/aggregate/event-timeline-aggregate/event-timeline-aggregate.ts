import { err, ok, type Result } from "neverthrow";
import { EventEntity } from "../../entity";
import { EventSortOrder, type EventId, type EventContent, type EventOccurredTiming, type WorkId } from "../../value-object";

type AddEventTimelineParamType = {
    occurredTiming: EventOccurredTiming;
    content: EventContent;
};

type UpdateEventTimelineSortParamType = {
    id: EventId;
    sortOrder: EventSortOrder;
};

/**
 * 時系列順の更新の失敗
 */
export type UpdateEventError ={ type: "EVENT_MISMATCH" }
    | { type: "DUPLICATE_SORT_ORDER"; };

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
     * @param params 作品と、作品に属する出来事
     * @returns 渡した値をそのまま保持する出来事の並び
     * @throws 事前条件を満たさない場合（取得処理の不具合）
     */
    static reconstruct(params: EventTimelineReconstructParamType): EventTimelineAggregate {
        return new EventTimelineAggregate(
            params.workId,
            params.events,
        );
    }

    /**
     * 出来事の時系列順を置き換える
     *
     * 引数の指定の誤り（自身は変更せずに err で返す）:
     * - 引数の出来事が保持する出来事と過不足なく一致しない場合（欠けている・既存にない ID が含まれる・ID が重複する）は EVENT_MISMATCH
     * - 引数の時系列順が重複する場合は DUPLICATE_SORT_ORDER
     *
     * 事後条件:
     * - 各出来事の時系列順を、引数で同じ ID に指定した値に置き換える（引数の配列の順番は問わない）
     * - 時系列順以外の値と、保持する出来事の順番は変更しない
     * @param params 保持するすべての出来事の ID と、置き換え後の時系列順
     * @returns 成功時は undefined、引数の指定の誤り時はその内容を持つ Result
     */
    update(params: UpdateEventTimelineSortParamType[]): Result<undefined, UpdateEventError> {
        const updateEventMap = new Map(params.map((param) => [param.id.value, param]));
        if (this._events.some((event => !updateEventMap.has(event.id.value)))) {
            return err({ type: "EVENT_MISMATCH" });
        }

        if (this._events.length !== params.length) {
            return err({ type: "EVENT_MISMATCH" });
        }

        // ソート順重複
        if (params.length !== new Set(params.map((param) => param.sortOrder.value)).size) {
            return err({ type: "DUPLICATE_SORT_ORDER" });
        }

        this._events = this._events.map((event) => {

            const targetEvent = updateEventMap.get(event.id.value);
            if (!targetEvent) {
                throw new Error(`照合済みの出来事が見つかりません。(ID: ${event.id.value})`);
            }

            return EventEntity.reconstruct({
                id: event.id,
                workId: event.workId,
                content: event.content,
                occurredTiming: event.occurredTiming,
                sortOrder: targetEvent.sortOrder,
                deleteFlg: event.deleteFlg,
            });
        });

        return ok(undefined);
    }

    /**
     * 出来事を末尾に追加する
     *
     * 事後条件:
     * - 自身の作品に属する、削除されていない出来事を1件追加する
     * - 追加した出来事の時系列順は、既存の出来事の最大値+1とする（既存がなければ先頭）
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
     * @returns 保持する出来事の値
     */
    toSnapshot(): EventTimelineSnapshotType[] {
        return this._events.map((event) => event.toSnapshot());
    }
}
