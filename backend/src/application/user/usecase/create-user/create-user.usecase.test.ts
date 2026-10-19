import { describe, it, expect, vi } from "vitest";
import { CreateUserUsecase } from "..";
import { UserNameUniquenessDomainService, type ICreateUserRepository, type IUserNameUniquenessRepository } from "../../../../domain/user";
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

function createUsecase(exists: boolean) {
  const repository = {
    createUser: vi.fn<ICreateUserRepository["createUser"]>().mockResolvedValue(undefined),
  } satisfies ICreateUserRepository;
  const uniquenessRepository = {
    findUser: vi.fn<IUserNameUniquenessRepository["findUser"]>().mockResolvedValue(exists ? [{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }] : []),
  } satisfies IUserNameUniquenessRepository;

  const usecase = new CreateUserUsecase(repository, testConfig, new UserNameUniquenessDomainService(uniquenessRepository));

  return { usecase, repository, uniquenessRepository };
}

describe("CreateUserUsecase", () => {
  it("名前が重複していない場合、ユーザーを1件作成し、トークンを含む結果を返すこと", async () => {
    const { usecase, repository } = createUsecase(false);

    const result = await usecase.execute({ body: BODY });

    const dto = result._unsafeUnwrap();
    expect(dto.value.user.name).toBe("testuser");
    expect(dto.value.user.birthday).toBe("19900101");
    expect(dto.value.accessToken).toBeTruthy();
    expect(dto.value.refreshToken).toBeTruthy();
    expect(repository.createUser).toHaveBeenCalledTimes(1);
  });

  it("名前が重複している場合、DUPLICATE_NAME を返し、ユーザーを作成しないこと", async () => {
    const { usecase, repository } = createUsecase(true);

    const result = await usecase.execute({ body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
    expect(repository.createUser).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず作成しないこと", async () => {
    const { usecase, repository, uniquenessRepository } = createUsecase(false);

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
    expect(uniquenessRepository.findUser).not.toHaveBeenCalled();
    expect(repository.createUser).not.toHaveBeenCalled();
  });

  it("確認用パスワードだけが一致しない場合も、INVALID_INPUT を返し作成しないこと", async () => {
    const { usecase, repository } = createUsecase(false);

    const result = await usecase.execute({ body: { ...BODY, confirmPassword: "password2" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } }],
    });
    expect(repository.createUser).not.toHaveBeenCalled();
  });
});
