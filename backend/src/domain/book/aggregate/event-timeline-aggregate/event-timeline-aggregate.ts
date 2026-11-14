import { err, ok, type Result } from "neverthrow";
import { EventEntity } from "../../entity";
import { EventSortOrder, type EventContent, type EventId, type EventOccurredTiming, type WorkId } from "../../value-object";

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
export type EventTimelineUpdateError = { type: "EVENT_MISMATCH" }
    | { type: "DUPLICATE_SORT_ORDER"; };

/**
 * 出来事の復元の失敗
 * - EVENT_NOT_FOUND: 復元対象の出来事が並びに存在しない、または削除されていない
 */
export type EventTimelineRestoreError = { type: "EVENT_NOT_FOUND" };

type EventTimelineReconstructParamType = {
    workId: WorkId;
    events: EventEntity[];
};

type EventTimelineSnapshotType = {
    id: string;
    workId: string;
    occurredTiming: string | null;
    content: string;
    sortOrder: number | null;
    deleteFlg: boolean;
}

/**
 * 作品内の出来事の並び（時系列順）
 *
 * 不変条件:
 * - 保持する出来事はすべて自身の作品に属すること
 * - 削除されていない出来事はすべて時系列順を持つこと
 *
 * 削除済みの出来事も保持する（復元時に別の読み込み方を用意しなくて済むため。書籍の集約が削除済みの作品を保持するのと同じ。docs/delete-restore/plan.md の P5）。
 * 削除済みの出来事は、並び替え・時系列順の採番の対象にしない。
 */
export class EventTimelineAggregate {

    /**
     * @throws 別の作品の出来事・時系列順を持たない削除されていない出来事が含まれる場合（不変条件違反）
     */
    private constructor(
        private readonly _workId: WorkId,
        private _events: EventEntity[],
    ) {
        const otherWorkEvent = _events.find((event) => event.workId.value !== _workId.value);
        if (otherWorkEvent) {
            throw new Error(`別の作品の出来事が含まれています。workId:${_workId.value} eventId:${otherWorkEvent.id.value}`);
        }

        _events.forEach((event) => EventTimelineAggregate.assertSortOrder(event));
    }

    /**
     * 削除されていない出来事が時系列順を持つことを確認する
     * @param event 出来事
     * @throws 削除されていない出来事が時系列順を持たない場合（不変条件違反）
     */
    private static assertSortOrder(event: EventEntity): void {
        if (!event.deleteFlg && event.sortOrder.value === null) {
            throw new Error(`時系列順を持たない出来事が含まれています。eventId:${event.id.value}`);
        }
    }

    /**
     * 永続化済みの値から出来事の並びを復元する
     *
     * 事前条件（満たさない場合は throw）:
     * - 出来事がすべて引数の作品に属すること
     * - 削除されていない出来事がすべて時系列順を持つこと
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

    /**
     * 出来事の時系列順を置き換える
     *
     * 引数の指定の誤り（自身は変更せずに err で返す）:
     * - 引数の出来事が保持する削除されていない出来事と過不足なく一致しない場合（欠けている・既存にない ID が含まれる・ID が重複する・削除済みの出来事の ID が含まれる）は EVENT_MISMATCH
     * - 引数の時系列順が重複する場合は DUPLICATE_SORT_ORDER
     *
     * 事後条件:
     * - 削除されていない各出来事の時系列順を、引数で同じ ID に指定した値に置き換える（引数の配列の順番は問わない）
     * - 時系列順以外の値・削除済みの出来事・保持する出来事の順番は変更しない
     * @param params 保持する削除されていないすべての出来事の ID と、置き換え後の時系列順
     * @returns 成功時は undefined、引数の指定の誤り時はその内容を持つ Result
     * @throws 時系列順を持たない値（null）を指定した場合（呼び出し側の不具合。自身は変更しない）
     */
    update(params: UpdateEventTimelineSortParamType[]): Result<undefined, EventTimelineUpdateError> {
        const updateEventMap = new Map(params.map((param) => [param.id.value, param]));
        const existsEvents = this._events.filter((event) => !event.deleteFlg);
        if (existsEvents.some((event => !updateEventMap.has(event.id.value)))) {
            return err({ type: "EVENT_MISMATCH" });
        }

        if (existsEvents.length !== params.length) {
            return err({ type: "EVENT_MISMATCH" });
        }

        // ソート順重複
        if (params.length !== new Set(params.map((param) => param.sortOrder.value)).size) {
            return err({ type: "DUPLICATE_SORT_ORDER" });
        }

        this._events = this._events.map((event) => {
            if (event.deleteFlg) {
                return event;
            }

            const eventId = event.id.value;
            const targetEvent = updateEventMap.get(eventId);
            if (!targetEvent) {
                throw new Error(`照合済みの出来事が見つかりません。(ID: ${eventId})`);
            }

            const updatedEvent = EventEntity.reconstruct({
                id: event.id,
                workId: event.workId,
                content: event.content,
                occurredTiming: event.occurredTiming,
                sortOrder: targetEvent.sortOrder,
                deleteFlg: event.deleteFlg,
            });
            // 時系列順を持たない値で置き換えると不変条件を満たさなくなるため、置き換え後に確認する（代入前に throw するため自身は変更されない）
            EventTimelineAggregate.assertSortOrder(updatedEvent);

            return updatedEvent;
        });

        return ok(undefined);
    }

    /**
     * 出来事を末尾に追加する
     *
     * 事後条件:
     * - 自身の作品に属する、削除されていない出来事を1件追加する
     * - 追加した出来事の時系列順は、削除されていない既存の出来事の最大値+1とする（なければ先頭）
     * - 既存の出来事は変更しない
     * @param params 追加する出来事の情報
     * @returns 追加した出来事
     */
    add(params: AddEventTimelineParamType): EventEntity {
        const event = EventEntity.create({
            workId: this._workId,
            occurredTiming: params.occurredTiming,
            content: params.content,
            sortOrder: this.nextSortOrder(),
        });

        this._events = [...this._events, event];

        return event;
    }

    /**
     * 削除済みの出来事を末尾に復元する
     *
     * 引数の指定の誤り（自身は変更せずに err で返す）:
     * - 指定した ID の出来事が並びに存在しない、または削除されていない場合は EVENT_NOT_FOUND
     *
     * 事後条件:
     * - 指定した出来事の削除済みを解除し、時系列順を削除されていない既存の出来事の最大値+1とする（なければ先頭。docs/delete-restore/plan.md の U13）
     * - 他の出来事と、保持する出来事の順番は変更しない
     * @param eventId 復元する出来事の ID
     * @returns 成功時は復元した出来事、指定の誤り時はその内容を持つ Result
     */
    restore(eventId: EventId): Result<EventEntity, EventTimelineRestoreError> {
        const targetEvent = this._events.find((event) => event.id.value === eventId.value && event.deleteFlg);
        if (!targetEvent) {
            return err({ type: "EVENT_NOT_FOUND" });
        }

        targetEvent.restore(this.nextSortOrder());

        return ok(targetEvent);
    }

    /**
     * 末尾に置く出来事の時系列順を採番する
     * @returns 削除されていない出来事の時系列順の最大値+1（なければ先頭）
     */
    private nextSortOrder(): EventSortOrder {
        const maxSortOrder = this._events
            .filter((event) => !event.deleteFlg)
            .reduce((max, event) => Math.max(max, event.sortOrder.value ?? EventSortOrder.FIRST - 1), EventSortOrder.FIRST - 1);

        return EventSortOrder.of(maxSortOrder + 1);
    }

    /**
     * スナップショットを作成
     * @returns 保持する出来事の値（削除済みを含む）
     */
    toSnapshot(): EventTimelineSnapshotType[] {
        return this._events.map((event) => (event.toSnapshot()));
    }
}
