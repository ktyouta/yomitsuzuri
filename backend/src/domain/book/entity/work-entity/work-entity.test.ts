import { describe, it, expect } from "vitest";
import { WorkEntity } from "..";
import { IconId, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../value-object";

const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("WorkEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const work = WorkEntity.create({
        title: WorkTitle.of("容疑者Xの献身"),
        sort: WorkSort.of(1),
        memo: WorkMemo.of("メモ"),
        iconId: IconId.of(4),
      });

      expect(work.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        title: "容疑者Xの献身",
        sort: 1,
        memo: "メモ",
        iconId: 4,
        deleteFlg: false,
      });
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま持つこと", () => {
      const work = WorkEntity.reconstruct({
        id: WorkId.of(WORK_ID),
        title: WorkTitle.of("容疑者Xの献身"),
        sort: WorkSort.of(2),
        memo: WorkMemo.of(null),
        iconId: IconId.of(5),
        deleteFlg: true,
      });

      expect(work.toSnapshot()).toEqual({
        id: WORK_ID,
        title: "容疑者Xの献身",
        sort: 2,
        memo: null,
        iconId: 5,
        deleteFlg: true,
      });
    });
  });
});
