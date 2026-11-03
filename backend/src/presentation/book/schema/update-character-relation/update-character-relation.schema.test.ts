import { describe, expect, it } from "vitest";
import { UpdateCharacterRelationSchema } from "..";

const VALID_BODY = {
  characterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
  targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC1",
  relationName: "兄",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("UpdateCharacterRelationSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    const result = UpdateCharacterRelationSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateCharacterRelationSchema.safeParse({ characterId: "", targetCharacterId: "", relationName: "" });
    expect(result.success).toBe(true);
  });

  it.each(["characterId", "targetCharacterId", "relationName"])("%s がない場合、エラーになること", (field) => {
    const result = UpdateCharacterRelationSchema.safeParse({ ...VALID_BODY, [field]: undefined });
    expect(result.success).toBe(false);
  });

  it.each([
    { characterId: 1 },
    { targetCharacterId: 1 },
    { relationName: 1 },
    { characterId: null },
    { targetCharacterId: null },
    { relationName: null },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateCharacterRelationSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });
});
