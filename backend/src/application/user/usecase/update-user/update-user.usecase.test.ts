import { describe, it, expect, vi } from "vitest";
import { UpdateUserUsecase } from "..";
import { UserBirthday, UserEntity } from "../../../../domain/user";
import { UserId, UserName } from "../../../../domain/shared";
import type { IUpdateUserRepository } from "../../../../domain/user";
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

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

function createRepository(
  duplicated: boolean,
  updateResult: Awaited<ReturnType<IUpdateUserRepository["updateUserWithLogin"]>>
) {
  return {
    checkUserNameExists: vi.fn<IUpdateUserRepository["checkUserNameExists"]>().mockResolvedValue(duplicated),
    updateUserWithLogin: vi.fn<IUpdateUserRepository["updateUserWithLogin"]>().mockResolvedValue(updateResult),
  } satisfies IUpdateUserRepository;
}

function createUpdatedEntity() {
  return new UserEntity(UserId.of(USER_ID), UserName.of("renamed"), UserBirthday.create("20000101")._unsafeUnwrap());
}

describe("UpdateUserUsecase", () => {
  it("名前が重複しておらずユーザーが存在する場合、更新後のユーザー・リフレッシュトークンを返すこと", async () => {
    const repository = createRepository(false, { entity: createUpdatedEntity(), darkMode: true });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    const dto = result._unsafeUnwrap();
    expect(dto.value.user.name).toBe("renamed");
    expect(dto.value.user.birthday).toBe("20000101");
    expect(dto.value.user.darkMode).toBe(true);
    expect(dto.value.refreshToken).toBeTruthy();
  });

  it("名前が重複している場合、DUPLICATE_NAME を返し、更新しないこと", async () => {
    const repository = createRepository(true, { entity: createUpdatedEntity(), darkMode: false });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
    expect(repository.updateUserWithLogin).not.toHaveBeenCalled();
  });

  it("ユーザーが存在しない場合、NOT_FOUND を返すこと", async () => {
    const repository = createRepository(false, undefined);
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず更新しないこと", async () => {
    const repository = createRepository(false, { entity: createUpdatedEntity(), darkMode: false });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "", birthday: "20000431" });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "USER_NAME_TOO_SHORT", min: 3 } },
        { field: "birthday", error: { type: "USER_BIRTHDAY_NOT_EXIST" } },
      ],
    });
    expect(repository.checkUserNameExists).not.toHaveBeenCalled();
    expect(repository.updateUserWithLogin).not.toHaveBeenCalled();
  });
});
