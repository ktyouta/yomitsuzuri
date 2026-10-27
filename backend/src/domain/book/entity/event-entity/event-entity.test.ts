import { describe, it, expect } from "vitest";
import { EventEntity } from "..";
import { EventContent, EventId, EventOccurredTiming, EventSortOrder, WorkId } from "../../value-object";

const EVENT_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function createEvent(deleteFlg = false) {
  return EventEntity.reconstruct({
    id: EventId.of(EVENT_ID),
    workId: WorkId.of(WORK_ID),
    occurredTiming: EventOccurredTiming.of("3日目の夜"),
    content: EventContent.of("屋敷の主人が書斎で倒れているのが見つかる"),
    sortOrder: EventSortOrder.of(2),
    deleteFlg,
  });
}

describe("EventEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const event = EventEntity.create({
        workId: WorkId.of(WORK_ID),
        occurredTiming: EventOccurredTiming.of("3日目の夜"),
        content: EventContent.of("屋敷の主人が書斎で倒れているのが見つかる"),
        sortOrder: EventSortOrder.of(2),
      });

      expect(event.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        workId: WORK_ID,
        occurredTiming: "3日目の夜",
        content: "屋敷の主人が書斎で倒れているのが見つかる",
        sortOrder: 2,
        deleteFlg: false,
      });
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま持つこと", () => {
      const event = createEvent(true);

      expect(event.toSnapshot()).toEqual({
        id: EVENT_ID,
        workId: WORK_ID,
        occurredTiming: "3日目の夜",
        content: "屋敷の主人が書斎で倒れているのが見つかる",
        sortOrder: 2,
        deleteFlg: true,
      });
    });
  });

  describe("update", () => {
    function updateParam() {
      return {
        occurredTiming: EventOccurredTiming.of(null),
        content: EventContent.of("執事が鍵を隠していたことが分かる"),
      };
    }

    it("自身の発生タイミング・内容を置き換え、ID・作品・時系列順・削除フラグは変更しないこと", () => {
      const event = createEvent();

      event.update(updateParam());

      expect(event.toSnapshot()).toEqual({
        id: EVENT_ID,
        workId: WORK_ID,
        occurredTiming: null,
        content: "執事が鍵を隠していたことが分かる",
        sortOrder: 2,
        deleteFlg: false,
      });
    });

    it("削除済みの場合は throw し、自身は変更しないこと", () => {
      const event = createEvent(true);
      const before = event.toSnapshot();

      expect(() => event.update(updateParam())).toThrow();
      expect(event.toSnapshot()).toEqual(before);
    });
  });
});
