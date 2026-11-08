import { describe, it, expect } from "vitest";
import { WorkEntity } from "..";
import { IconId, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../value-object";
import { Timestamp } from "../../../shared";

const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const UPDATED_AT = "2026-01-01T00:00:00.000Z";
const NEW_UPDATED_AT = "2026-01-02T00:00:00.000Z";

describe("WorkEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const work = WorkEntity.create({
        title: WorkTitle.of("容疑者Xの献身"),
        sort: WorkSort.of(1),
        memo: WorkMemo.of("メモ"),
        iconId: IconId.of(4),
        updatedAt: Timestamp.of(UPDATED_AT),
      });

      expect(work.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        title: "容疑者Xの献身",
        sort: 1,
        memo: "メモ",
        iconId: 4,
        deleteFlg: false,
        updatedAt: UPDATED_AT,
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
        updatedAt: Timestamp.of(UPDATED_AT),
      });

      expect(work.toSnapshot()).toEqual({
        id: WORK_ID,
        title: "容疑者Xの献身",
        sort: 2,
        memo: null,
        iconId: 5,
        deleteFlg: true,
        updatedAt: UPDATED_AT,
      });
    });
  });

  describe("update", () => {
    function createWork() {
      return WorkEntity.reconstruct({
        id: WorkId.of(WORK_ID),
        title: WorkTitle.of("容疑者Xの献身"),
        sort: WorkSort.of(2),
        memo: WorkMemo.of("メモ"),
        iconId: IconId.of(5),
        deleteFlg: false,
        updatedAt: Timestamp.of(UPDATED_AT),
      });
    }

    it("画面の表示時点の更新日時が一致する場合、作品名・メモ・アイコン・更新日時だけを置き換えた作品を返し、自身は変更しないこと", () => {
      const work = createWork();

      const result = work.update({
        title: WorkTitle.of("聖女の救済"),
        memo: WorkMemo.of(null),
        iconId: IconId.of(6),
        expectedUpdatedAt: Timestamp.of(UPDATED_AT),
        updatedAt: Timestamp.of(NEW_UPDATED_AT),
      });

      expect(result._unsafeUnwrap().toSnapshot()).toEqual({
        id: WORK_ID,
        title: "聖女の救済",
        sort: 2,
        memo: null,
        iconId: 6,
        deleteFlg: false,
        updatedAt: NEW_UPDATED_AT,
      });
      expect(work.toSnapshot()).toEqual(createWork().toSnapshot());
    });

    it("画面の表示時点の更新日時が一致しない場合、CONFLICT_WORK を返し、自身は変更しないこと", () => {
      const work = createWork();

      const result = work.update({
        title: WorkTitle.of("聖女の救済"),
        memo: WorkMemo.of(null),
        iconId: IconId.of(6),
        expectedUpdatedAt: Timestamp.of("2025-12-31T00:00:00.000Z"),
        updatedAt: Timestamp.of(NEW_UPDATED_AT),
      });

      expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
      expect(work.toSnapshot()).toEqual(createWork().toSnapshot());
    });
  });
});
