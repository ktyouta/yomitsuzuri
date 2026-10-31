import { describe, it, expect } from "vitest";
import { UpdateEventOrderResultDto } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, WorkId } from "../../../../domain/book";

const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

function createEvent(id: string, sortOrder: number, occurredTiming: string | null) {
  return EventEntity.reconstruct({
    id: EventId.of(id),
    workId: WorkId.of(WORK_ID),
    occurredTiming: EventOccurredTiming.of(occurredTiming),
    content: EventContent.of(`内容${id}`),
    sortOrder: EventSortOrder.of(sortOrder),
    deleteFlg: false,
  });
}

describe("UpdateEventOrderResultDto", () => {
  it("出来事の並びから、時系列順の昇順に並べた DTO を生成できること", () => {
    const timeline = EventTimelineAggregate.reconstruct({
      workId: WorkId.of(WORK_ID),
      events: [createEvent("01BX5ZZKBKACTAV9WEVGEMMVT1", 2, "3日目の夜"), createEvent("01BX5ZZKBKACTAV9WEVGEMMVT2", 1, null)],
    });

    const dto = new UpdateEventOrderResultDto(timeline);

    expect(dto.value).toEqual({
      list: [
        { id: "01BX5ZZKBKACTAV9WEVGEMMVT2", occurredTiming: null, content: "内容01BX5ZZKBKACTAV9WEVGEMMVT2", sortOrder: 1 },
        { id: "01BX5ZZKBKACTAV9WEVGEMMVT1", occurredTiming: "3日目の夜", content: "内容01BX5ZZKBKACTAV9WEVGEMMVT1", sortOrder: 2 },
      ],
    });
  });

  it("出来事がない場合、空の一覧を返すこと", () => {
    const timeline = EventTimelineAggregate.reconstruct({ workId: WorkId.of(WORK_ID), events: [] });

    expect(new UpdateEventOrderResultDto(timeline).value).toEqual({ list: [] });
  });
});
