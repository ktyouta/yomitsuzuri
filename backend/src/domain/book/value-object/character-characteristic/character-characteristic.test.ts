import { describe, it, expect } from "vitest";
import { CharacterCharacteristic } from "../../..";

describe("CharacterCharacteristic", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(CharacterCharacteristic.create("論理的思考に長けている")._unsafeUnwrap().value).toBe("論理的思考に長けている");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(CharacterCharacteristic.create("  論理的思考に長けている\n")._unsafeUnwrap().value).toBe("論理的思考に長けている");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(CharacterCharacteristic.create("あ".repeat(CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (value) => {
      expect(CharacterCharacteristic.create(value)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、CHARACTER_CHARACTERISTIC_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(CharacterCharacteristic.create("あ".repeat(CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "CHARACTER_CHARACTERISTIC_TOO_LONG",
        max: CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CharacterCharacteristic.of("論理的思考に長けている").value).toBe("論理的思考に長けている");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CharacterCharacteristic.of("あ".repeat(CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH + 1))).toThrow();
    });
  });
});
