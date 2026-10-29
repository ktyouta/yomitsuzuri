import { describe, it, expect } from "vitest";
import { EventTimelineAggregate } from "..";
import { EventEntity } from "../../entity";
import { EventContent, EventId, EventOccurredTiming, EventSortOrder, WorkId } from "../../value-object";

const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const OTHER_WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const EVENT_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const EVENT_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function createEvent(id: string, sortOrder: number, deleteFlg = false, workId = WORK_ID) {
  return EventEntity.reconstruct({
    id: EventId.of(id),
    workId: WorkId.of(workId),
    occurredTiming: EventOccurredTiming.of("3日目の夜"),
    content: EventContent.of("屋敷の主人が書斎で倒れているのが見つかる"),
    sortOrder: EventSortOrder.of(sortOrder),
    deleteFlg,
  });
}

function addParam() {
  return {
    occurredTiming: EventOccurredTiming.of(null),
    content: EventContent.of("執事が鍵を隠していたことが分かる"),
  };
}

describe("EventTimelineAggregate", () => {
  describe("reconstruct", () => {
    it("渡した出来事をそのまま保持すること", () => {
      const timeline = EventTimelineAggregate.reconstruct({
        workId: WorkId.of(WORK_ID),
        events: [createEvent(EVENT_ID_1, 1), createEvent(EVENT_ID_2, 2)],
      });

      expect(timeline.toSnapshot()).toEqual([
        createEvent(EVENT_ID_1, 1).toSnapshot(),
        createEvent(EVENT_ID_2, 2).toSnapshot(),
      ]);
    });

    it("別の作品の出来事が含まれる場合は throw すること", () => {
      expect(() => EventTimelineAggregate.reconstruct({
        workId: WorkId.of(WORK_ID),
        events: [createEvent(EVENT_ID_1, 1), createEvent(EVENT_ID_2, 2, false, OTHER_WORK_ID)],
      })).toThrow();
    });
  });

  describe("add", () => {
    it("出来事がない場合、自身の作品に属する削除されていない出来事を先頭の時系列順で追加し、追加した出来事を返すこと", () => {
      const timeline = EventTimelineAggregate.reconstruct({ workId: WorkId.of(WORK_ID), events: [] });

      const added = timeline.add(addParam());

      const expected = {
        id: expect.stringMatching(ULID_PATTERN),
        workId: WORK_ID,
        occurredTiming: null,
        content: "執事が鍵を隠していたことが分かる",
        sortOrder: EventSortOrder.FIRST,
        deleteFlg: false,
      };
      expect(timeline.toSnapshot()).toEqual([expected]);
      expect(added.toSnapshot()).toEqual(timeline.toSnapshot()[0]);
    });

    it("既存の出来事がある場合、時系列順の最大値+1で末尾に追加し、既存の出来事は変更しないこと", () => {
      const timeline = EventTimelineAggregate.reconstruct({
        workId: WorkId.of(WORK_ID),
        events: [createEvent(EVENT_ID_1, 3), createEvent(EVENT_ID_2, 1)],
      });
      const before = timeline.toSnapshot();

      const added = timeline.add(addParam());

      const after = timeline.toSnapshot();
      expect(after.slice(0, 2)).toEqual(before);
      expect(added.sortOrder.value).toBe(4);
      expect(after[2]).toEqual(added.toSnapshot());
    });
  });

  describe("update", () => {
    const EVENT_ID_3 = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

    /** 出来事1（時系列順1）・出来事2（時系列順2）を持つ出来事の並び */
    function createTimeline() {
      return EventTimelineAggregate.reconstruct({
        workId: WorkId.of(WORK_ID),
        events: [createEvent(EVENT_ID_1, 1), createEvent(EVENT_ID_2, 2)],
      });
    }

    function sortParam(id: string, sortOrder: number) {
      return { id: EventId.of(id), sortOrder: EventSortOrder.of(sortOrder) };
    }

    it("各出来事の時系列順を同じ ID に指定した値に置き換え、時系列順以外の値と出来事の順番は変更しないこと（引数の配列の順番は問わない）", () => {
      const timeline = createTimeline();

      const result = timeline.update([sortParam(EVENT_ID_2, 1), sortParam(EVENT_ID_1, 2)]);

      expect(result.isOk()).toBe(true);
      expect(timeline.toSnapshot()).toEqual([
        createEvent(EVENT_ID_1, 2).toSnapshot(),
        createEvent(EVENT_ID_2, 1).toSnapshot(),
      ]);
    });

    it.each([
      ["既存の出来事が欠けている", [sortParam(EVENT_ID_1, 1)]],
      ["既存にない ID が含まれる", [sortParam(EVENT_ID_1, 1), sortParam(EVENT_ID_2, 2), sortParam(EVENT_ID_3, 3)]],
      ["ID が重複する", [sortParam(EVENT_ID_1, 1), sortParam(EVENT_ID_2, 2), sortParam(EVENT_ID_1, 3)]],
    ])("%s場合は EVENT_MISMATCH を返し、自身は変更しないこと", (_, params) => {
      const timeline = createTimeline();
      const before = timeline.toSnapshot();

      const result = timeline.update(params);

      expect(result._unsafeUnwrapErr()).toEqual({ type: "EVENT_MISMATCH" });
      expect(timeline.toSnapshot()).toEqual(before);
    });

    it("時系列順が重複する場合は DUPLICATE_SORT_ORDER を返し、自身は変更しないこと", () => {
      const timeline = createTimeline();
      const before = timeline.toSnapshot();

      const result = timeline.update([sortParam(EVENT_ID_1, 3), sortParam(EVENT_ID_2, 3)]);

      expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_SORT_ORDER" });
      expect(timeline.toSnapshot()).toEqual(before);
    });
  });
});
