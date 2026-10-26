import { describe, it, expect } from "vitest";
import { WordEntity } from "..";
import { WordId, WordMemo, WordPage, WordText, WorkId } from "../../value-object";

const WORD_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function createWord(deleteFlg = false) {
  return WordEntity.reconstruct({
    id: WordId.of(WORD_ID),
    workId: WorkId.of(WORK_ID),
    text: WordText.of("赤い手帳"),
    memo: WordMemo.of("メモ"),
    page: WordPage.of(42),
    deleteFlg,
  });
}

describe("WordEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const word = WordEntity.create({
        workId: WorkId.of(WORK_ID),
        text: WordText.of("赤い手帳"),
        memo: WordMemo.of("メモ"),
        page: WordPage.of(42),
      });

      expect(word.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        workId: WORK_ID,
        text: "赤い手帳",
        memo: "メモ",
        page: 42,
        deleteFlg: false,
      });
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま持つこと", () => {
      const word = createWord(true);

      expect(word.toSnapshot()).toEqual({
        id: WORD_ID,
        workId: WORK_ID,
        text: "赤い手帳",
        memo: "メモ",
        page: 42,
        deleteFlg: true,
      });
    });
  });

  describe("update", () => {
    function updateParam() {
      return {
        text: WordText.of("青い封筒"),
        memo: WordMemo.of(null),
        page: WordPage.of(null),
      };
    }

    it("自身のワード・メモ・ページを置き換え、ID・作品・削除フラグは変更しないこと", () => {
      const word = createWord();

      word.update(updateParam());

      expect(word.toSnapshot()).toEqual({
        id: WORD_ID,
        workId: WORK_ID,
        text: "青い封筒",
        memo: null,
        page: null,
        deleteFlg: false,
      });
    });

    it("削除済みの場合は throw し、自身は変更しないこと", () => {
      const word = createWord(true);
      const before = word.toSnapshot();

      expect(() => word.update(updateParam())).toThrow();
      expect(word.toSnapshot()).toEqual(before);
    });
  });
});
