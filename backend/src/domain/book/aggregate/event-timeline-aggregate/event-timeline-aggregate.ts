import type { EventId, EventSortOrder } from "../../value-object";

type CreateEventTimelineParamType = {
    sortOrder: EventSortOrder;
};

type EventTimelineReconstructParamType = {
    id: EventId;
    sortOrder: EventSortOrder;
};

type EventTimelineSnapshotType = {
    id: string;
    sortOrder: number;
}

export class EventTimelineAggregate {

    private constructor(private _orders: { id: EventId, sortOrder: EventSortOrder }[]) { }

    toSnapshot(): EventTimelineSnapshotType[] {
        return this._orders.map((order) => {
            return {
                id: order.id.value,
                sortOrder: order.sortOrder.value
            };
        })
    }
}