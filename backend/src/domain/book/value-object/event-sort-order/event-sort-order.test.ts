import { describe, it, expect } from "vitest";
import { EventSortOrder } from "../../..";

describe("EventSortOrder", () => {
  describe("create", () => {
    it("1以上の整数で生成できること", () => {
      expect(EventSortOrder.create(1)._unsafeUnwrap().value).toBe(1);
      expect(EventSortOrder.create(2)._unsafeUnwrap().value).toBe(2);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、EVENT_SORT_ORDER_INVALID を最小値とともに返すこと", (sortOrder) => {
      expect(EventSortOrder.create(sortOrder)._unsafeUnwrapErr()).toEqual({ type: "EVENT_SORT_ORDER_INVALID", min: EventSortOrder.FIRST });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(EventSortOrder.of(3).value).toBe(3);
    });

    it("null の場合は時系列順を持たない状態で生成できること", () => {
      expect(EventSortOrder.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => EventSortOrder.of(0)).toThrow();
    });
  });

  describe("reset", () => {
    it("値が null の時系列順を返し、自身は変更しないこと", () => {
      const sortOrder = EventSortOrder.of(3);

      expect(sortOrder.reset().value).toBeNull();
      expect(sortOrder.value).toBe(3);
    });
  });
});
