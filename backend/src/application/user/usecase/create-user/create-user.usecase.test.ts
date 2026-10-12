import { describe, it, expect, vi } from "vitest";
import { CreateUserUsecase } from "..";
import type { ICreateUserRepository } from "../../../../domain/user";
import type { EnvConfig } from "../../../../config";

const testConfig: EnvConfig = {
  accessTokenJwtKey: "test-jwt-secret-key-for-access-token",
  accessTokenExpires: "15m",
  refreshTokenJwtKey: "test-jwt-secret-key-for-refresh-token",
  refreshTokenExpires: "7d",
  pepper: "test-pepper",
  corsOrigin: ["http://localhost:5173"],
  isProduction: false,
  allowUserOperation: true,
};

const BODY = { name: "testuser", birthday: "19900101", password: "password", confirmPassword: "password" };

function createRepository(exists: boolean) {
  return {
    existsByUserName: vi.fn<ICreateUserRepository["existsByUserName"]>().mockResolvedValue(exists),
    createUserWithLogin: vi.fn<ICreateUserRepository["createUserWithLogin"]>().mockResolvedValue(undefined),
  } satisfies ICreateUserRepository;
}

describe("CreateUserUsecase", () => {
  it("名前が重複していない場合、ユーザーを1件作成し、トークンを含む結果を返すこと", async () => {
    const repository = createRepository(false);
    const usecase = new CreateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ body: BODY });

    const dto = result._unsafeUnwrap();
    expect(dto.value.user.name).toBe("testuser");
    expect(dto.value.user.birthday).toBe("19900101");
    expect(dto.value.accessToken).toBeTruthy();
    expect(dto.value.refreshToken).toBeTruthy();
    expect(repository.createUserWithLogin).toHaveBeenCalledTimes(1);
  });

  it("名前が重複している場合、DUPLICATE_NAME を返し、ユーザーを作成しないこと", async () => {
    const repository = createRepository(true);
    const usecase = new CreateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
    expect(repository.createUserWithLogin).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず作成しないこと", async () => {
    const repository = createRepository(false);
    const usecase = new CreateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ body: { name: "ab", birthday: "19990229", password: "short", confirmPassword: "other" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "USER_NAME_TOO_SHORT", min: 3 } },
        { field: "birthday", error: { type: "USER_BIRTHDAY_NOT_EXIST" } },
        { field: "password", error: { type: "NEW_PASSWORD_TOO_SHORT", min: 8 } },
        { field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } },
      ],
    });
    expect(repository.existsByUserName).not.toHaveBeenCalled();
    expect(repository.createUserWithLogin).not.toHaveBeenCalled();
  });

  it("確認用パスワードだけが一致しない場合も、INVALID_INPUT を返し作成しないこと", async () => {
    const repository = createRepository(false);
    const usecase = new CreateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ body: { ...BODY, confirmPassword: "password2" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } }],
    });
    expect(repository.createUserWithLogin).not.toHaveBeenCalled();
  });
});
