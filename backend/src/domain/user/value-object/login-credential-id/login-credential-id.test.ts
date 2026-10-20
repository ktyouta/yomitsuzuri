import { describe, it, expect } from "vitest";
import { LoginCredentialId } from "../../..";

describe("LoginCredentialId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const loginCredentialId = LoginCredentialId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(loginCredentialId.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => LoginCredentialId.of("")).toThrow("ログイン情報IDが設定されていません。");
  });

  it("createでULID（26文字）を生成できること", () => {
    const loginCredentialId = LoginCredentialId.create();
    expect(loginCredentialId.value).toHaveLength(26);
  });

  it("createは毎回異なるIDを生成すること", () => {
    const id1 = LoginCredentialId.create();
    const id2 = LoginCredentialId.create();
    expect(id1.value).not.toBe(id2.value);
  });
});
