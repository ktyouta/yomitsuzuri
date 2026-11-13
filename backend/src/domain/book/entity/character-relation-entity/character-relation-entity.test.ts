import { describe, it, expect } from "vitest";
import { CharacterRelationEntity } from "..";
import { CharacterId, CharacterRelationId, CharacterRelationName, WorkId } from "../../value-object";

const RELATION_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const CHARACTER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const TARGET_CHARACTER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function reconstructRelation(deleteFlg = false) {
  return CharacterRelationEntity.reconstruct({
    id: CharacterRelationId.of(RELATION_ID),
    workId: WorkId.of(WORK_ID),
    characterId: CharacterId.of(CHARACTER_ID),
    targetCharacterId: CharacterId.of(TARGET_CHARACTER_ID),
    relationName: CharacterRelationName.of("兄"),
    deleteFlg,
  });
}

describe("CharacterRelationEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const relation = CharacterRelationEntity.create({
        workId: WorkId.of(WORK_ID),
        characterId: CharacterId.of(CHARACTER_ID),
        targetCharacterId: CharacterId.of(TARGET_CHARACTER_ID),
        relationName: CharacterRelationName.of("兄"),
      })._unsafeUnwrap();

      expect(relation.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        workId: WORK_ID,
        characterId: CHARACTER_ID,
        targetCharacterId: TARGET_CHARACTER_ID,
        relationName: "兄",
        deleteFlg: false,
      });
    });

    it("人物と相手が同じ場合、CHARACTER_RELATION_SELF を返すこと", () => {
      const result = CharacterRelationEntity.create({
        workId: WorkId.of(WORK_ID),
        characterId: CharacterId.of(CHARACTER_ID),
        targetCharacterId: CharacterId.of(CHARACTER_ID),
        relationName: CharacterRelationName.of("兄"),
      });

      expect(result._unsafeUnwrapErr()).toEqual({ type: "CHARACTER_RELATION_SELF" });
    });
  });

  describe("reconstruct", () => {
    it("渡した ID・削除フラグを含め、値をそのまま持つこと", () => {
      const relation = reconstructRelation(true);

      expect(relation.toSnapshot()).toEqual({
        id: RELATION_ID,
        workId: WORK_ID,
        characterId: CHARACTER_ID,
        targetCharacterId: TARGET_CHARACTER_ID,
        relationName: "兄",
        deleteFlg: true,
      });
    });

    it("人物と相手が同じ場合は throw すること", () => {
      expect(() => CharacterRelationEntity.reconstruct({
        id: CharacterRelationId.of(RELATION_ID),
        workId: WorkId.of(WORK_ID),
        characterId: CharacterId.of(CHARACTER_ID),
        targetCharacterId: CharacterId.of(CHARACTER_ID),
        relationName: CharacterRelationName.of("兄"),
        deleteFlg: false,
      })).toThrow();
    });
  });

  describe("update", () => {
    // 人物と相手を入れ替え、関係名も変える
    function updateParam() {
      return {
        characterId: CharacterId.of(TARGET_CHARACTER_ID),
        targetCharacterId: CharacterId.of(CHARACTER_ID),
        relationName: CharacterRelationName.of("弟"),
      };
    }

    it("自身の人物・相手・関係名を置き換えて ok を返し、ID・作品・削除フラグは変更しないこと", () => {
      const relation = reconstructRelation();

      const result = relation.update(updateParam());

      expect(result.isOk()).toBe(true);
      expect(relation.toSnapshot()).toEqual({
        id: RELATION_ID,
        workId: WORK_ID,
        characterId: TARGET_CHARACTER_ID,
        targetCharacterId: CHARACTER_ID,
        relationName: "弟",
        deleteFlg: false,
      });
    });

    it("人物と相手が同じ場合、CHARACTER_RELATION_SELF を返し、自身は変更しないこと", () => {
      const relation = reconstructRelation();
      const before = relation.toSnapshot();

      const result = relation.update({
        characterId: CharacterId.of(CHARACTER_ID),
        targetCharacterId: CharacterId.of(CHARACTER_ID),
        relationName: CharacterRelationName.of("弟"),
      });

      expect(result._unsafeUnwrapErr()).toEqual({ type: "CHARACTER_RELATION_SELF" });
      expect(relation.toSnapshot()).toEqual(before);
    });

    it("削除済みの場合は throw し、自身は変更しないこと", () => {
      const relation = reconstructRelation(true);
      const before = relation.toSnapshot();

      expect(() => relation.update(updateParam())).toThrow();
      expect(relation.toSnapshot()).toEqual(before);
    });
  });

  describe("delete", () => {
    it("自身を削除済みにし、他の値は変更しないこと", () => {
      const relation = reconstructRelation();

      relation.delete();

      expect(relation.toSnapshot()).toEqual({
        id: RELATION_ID,
        workId: WORK_ID,
        characterId: CHARACTER_ID,
        targetCharacterId: TARGET_CHARACTER_ID,
        relationName: "兄",
        deleteFlg: true,
      });
    });

    it("既に削除済みの場合は throw し、自身は変更しないこと", () => {
      const relation = reconstructRelation(true);
      const before = relation.toSnapshot();

      expect(() => relation.delete()).toThrow("既に削除済みの登場人物関係です。");
      expect(relation.toSnapshot()).toEqual(before);
    });
  });

  describe("restore", () => {
    it("自身の削除済みを解除し、他の値は変更しないこと", () => {
      const relation = reconstructRelation(true);
      const before = relation.toSnapshot();

      relation.restore();

      expect(relation.toSnapshot()).toEqual({ ...before, deleteFlg: false });
    });

    it("削除されていない場合は throw し、自身は変更しないこと", () => {
      const relation = reconstructRelation();
      const before = relation.toSnapshot();

      expect(() => relation.restore()).toThrow("削除されていない登場人物関係です。");
      expect(relation.toSnapshot()).toEqual(before);
    });
  });
});
