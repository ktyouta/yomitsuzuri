import { describe, it, expect } from "vitest";
import { CharacterEntity } from "..";
import { CharacterAge, CharacterCharacteristic, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId } from "../../value-object";

const CHARACTER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function createCharacter(deleteFlg = false) {
  return CharacterEntity.reconstruct({
    id: CharacterId.of(CHARACTER_ID),
    workId: WorkId.of(WORK_ID),
    name: CharacterName.of("石神哲哉"),
    age: CharacterAge.of("40代"),
    genderId: GenderId.of(1),
    occupation: CharacterOccupation.of("数学教師"),
    characteristic: CharacterCharacteristic.of("天才数学者"),
    memo: CharacterMemo.of("メモ"),
    deleteFlg,
  });
}

describe("CharacterEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const character = CharacterEntity.create({
        workId: WorkId.of(WORK_ID),
        name: CharacterName.of("石神哲哉"),
        age: CharacterAge.of("40代"),
        genderId: GenderId.of(1),
        occupation: CharacterOccupation.of("数学教師"),
        characteristic: CharacterCharacteristic.of("天才数学者"),
        memo: CharacterMemo.of("メモ"),
      });

      expect(character.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        workId: WORK_ID,
        name: "石神哲哉",
        age: "40代",
        genderId: 1,
        occupation: "数学教師",
        characteristic: "天才数学者",
        memo: "メモ",
        deleteFlg: false,
      });
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま持つこと", () => {
      const character = createCharacter(true);

      expect(character.toSnapshot()).toEqual({
        id: CHARACTER_ID,
        workId: WORK_ID,
        name: "石神哲哉",
        age: "40代",
        genderId: 1,
        occupation: "数学教師",
        characteristic: "天才数学者",
        memo: "メモ",
        deleteFlg: true,
      });
    });
  });

  describe("update", () => {
    function updateParam() {
      return {
        name: CharacterName.of("湯川学"),
        age: CharacterAge.of(null),
        genderId: GenderId.of(null),
        occupation: CharacterOccupation.of("物理学者"),
        characteristic: CharacterCharacteristic.of(null),
        memo: CharacterMemo.of(null),
      };
    }

    it("自身の名前・年齢・性別・職業・特徴・メモを置き換え、ID・作品・削除フラグは変更しないこと", () => {
      const character = createCharacter();

      character.update(updateParam());

      expect(character.toSnapshot()).toEqual({
        id: CHARACTER_ID,
        workId: WORK_ID,
        name: "湯川学",
        age: null,
        genderId: null,
        occupation: "物理学者",
        characteristic: null,
        memo: null,
        deleteFlg: false,
      });
    });

    it("削除済みの場合は throw し、自身は変更しないこと", () => {
      const character = createCharacter(true);
      const before = character.toSnapshot();

      expect(() => character.update(updateParam())).toThrow();
      expect(character.toSnapshot()).toEqual(before);
    });
  });

  describe("delete", () => {
    it("自身を削除済みにすること", () => {
      const character = createCharacter();
      const before = character.toSnapshot();

      character.delete();

      expect(character.toSnapshot()).toEqual({ ...before, deleteFlg: true });
    });

    it("既に削除済みの場合は throw すること", () => {
      const character = createCharacter(true);

      expect(() => character.delete()).toThrow();
    });
  });

  describe("restore", () => {
    it("自身の削除済みを解除すること", () => {
      const character = createCharacter(true);
      const before = character.toSnapshot();

      character.restore();

      expect(character.toSnapshot()).toEqual({ ...before, deleteFlg: false });
    });

    it("削除されていない場合は throw すること", () => {
      const character = createCharacter();

      expect(() => character.restore()).toThrow();
    });
  });
});
