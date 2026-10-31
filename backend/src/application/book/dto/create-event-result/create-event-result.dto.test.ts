import { describe, it, expect } from "vitest";
import { CreateEventResultDto } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, WorkId } from "../../../../domain/book";

function createEvent(occurredTiming: string | null) {
  return EventEntity.reconstruct({
    id: EventId.of("01BX5ZZKBKACTAV9WEVGEMMVT0"),
    workId: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"),
    occurredTiming: EventOccurredTiming.of(occurredTiming),
    content: EventContent.of("屋敷の主人が書斎で倒れているのが見つかる"),
    sortOrder: EventSortOrder.of(3),
    deleteFlg: false,
  });
}

describe("CreateEventResultDto", () => {
  it("出来事からDTOを生成できること", () => {
    const dto = new CreateEventResultDto(createEvent("3日目の夜"));

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      sortOrder: 3,
    });
  });

  it("発生タイミングが null の場合、null のまま返すこと", () => {
    const dto = new CreateEventResultDto(createEvent(null));

    expect(dto.value.occurredTiming).toBeNull();
  });
});
