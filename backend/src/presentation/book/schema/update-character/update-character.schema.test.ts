import { describe, expect, it } from "vitest";
import { UpdateCharacterSchema } from "..";

const VALID_BODY = {
  name: "石神哲哉",
  age: "40代",
  genderId: 1,
  occupation: "数学教師",
  characteristic: "天才数学者",
  memo: "メモ",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("UpdateCharacterSchema", () => {
  it("名前のみの場合、通ること", () => {
    const result = UpdateCharacterSchema.safeParse({ name: "石神哲哉" });
    expect(result.success).toBe(true);
  });

  it("全項目を指定した場合、通ること", () => {
    const result = UpdateCharacterSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("名前以外が null の場合、通ること", () => {
    const result = UpdateCharacterSchema.safeParse({ name: "石神哲哉", age: null, genderId: null, occupation: null, characteristic: null, memo: null });
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateCharacterSchema.safeParse({ ...VALID_BODY, name: "", genderId: 0 });
    expect(result.success).toBe(true);
  });

  it("名前がない場合、エラーになること", () => {
    const result = UpdateCharacterSchema.safeParse({ age: "40代" });
    expect(result.success).toBe(false);
  });

  it.each([
    { name: 1 },
    { age: 40 },
    { genderId: "1" },
    { occupation: 1 },
    { characteristic: 1 },
    { memo: 1 },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateCharacterSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });
});
