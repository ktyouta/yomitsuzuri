import { describe, it, expect, vi } from "vitest";
import { UpdateUserUsecase } from "../../../../src/application/user/usecase";
import { UserBirthday, UserEntity, UserId, UserName } from "../../../../src/domain/user";
import type { IUpdateUserRepository } from "../../../../src/domain/user";
import type { EnvConfig } from "../../../../src/config";

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
  return new UserEntity(UserId.of(USER_ID), new UserName("renamed"), new UserBirthday("20000101"));
}

describe("UpdateUserUsecase", () => {
  it("名前が重複しておらずユーザーが存在する場合、successと更新後のユーザー・リフレッシュトークンを返すこと", async () => {
    const repository = createRepository(false, { entity: createUpdatedEntity(), darkMode: true });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, "renamed", "20000101");

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      return;
    }
    expect(result.dto.value.user.name).toBe("renamed");
    expect(result.dto.value.user.birthday).toBe("20000101");
    expect(result.dto.value.user.darkMode).toBe(true);
    expect(result.dto.value.refreshToken).toBeTruthy();
  });

  it("名前が重複している場合、duplicateを返し、更新しないこと", async () => {
    const repository = createRepository(true, { entity: createUpdatedEntity(), darkMode: false });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, "renamed", "20000101");

    expect(result.status).toBe("duplicate");
    expect(repository.updateUserWithLogin).not.toHaveBeenCalled();
  });

  it("ユーザーが存在しない場合、not_foundを返すこと", async () => {
    const repository = createRepository(false, undefined);
    const usecase = new UpdateUserUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, "renamed", "20000101");

    expect(result.status).toBe("not_found");
  });

  it("ユーザーIDが空の場合、例外になり、更新しないこと", async () => {
    const repository = createRepository(false, { entity: createUpdatedEntity(), darkMode: false });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    await expect(usecase.execute("", "renamed", "20000101")).rejects.toThrow();
    expect(repository.updateUserWithLogin).not.toHaveBeenCalled();
  });

  it("名前が空の場合、例外になり、更新しないこと", async () => {
    const repository = createRepository(false, { entity: createUpdatedEntity(), darkMode: false });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    await expect(usecase.execute(USER_ID, "", "20000101")).rejects.toThrow();
    expect(repository.updateUserWithLogin).not.toHaveBeenCalled();
  });

  it("生年月日が不正な場合、例外になり、更新しないこと", async () => {
    const repository = createRepository(false, { entity: createUpdatedEntity(), darkMode: false });
    const usecase = new UpdateUserUsecase(repository, testConfig);

    await expect(usecase.execute(USER_ID, "renamed", "20000431")).rejects.toThrow();
    expect(repository.updateUserWithLogin).not.toHaveBeenCalled();
  });
});
