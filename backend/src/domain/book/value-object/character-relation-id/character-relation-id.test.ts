import { describe, it, expect } from "vitest";
import { CharacterRelationId } from "../../..";

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("CharacterRelationId", () => {
  describe("of", () => {
    it.each(["01ARZ3NDEKTSV4RRFFQ69G5FAV", "invalid"])("空でなければ（%s）、そのまま保持すること（形式は判定しない）", (relationId) => {
      expect(CharacterRelationId.of(relationId).value).toBe(relationId);
    });

    it("空の場合は throw すること", () => {
      expect(() => CharacterRelationId.of("")).toThrow("登場人物関係IDが設定されていません。");
    });
  });

  describe("create", () => {
    it("ULID 形式の ID を生成すること", () => {
      expect(CharacterRelationId.create().value).toMatch(ULID_PATTERN);
    });

    it("毎回異なるIDを生成すること", () => {
      expect(CharacterRelationId.create().value).not.toBe(CharacterRelationId.create().value);
    });
  });
});
