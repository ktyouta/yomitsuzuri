import { describe, it, expect, vi } from "vitest";
import { CreateUserUsecase } from "../../../../src/application/user/usecase";
import type { ICreateUserRepository } from "../../../../src/domain/user";
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

    const result = await usecase.execute("testuser", "19900101", "password");

    expect(result).not.toBeNull();
    expect(result?.value.user.name).toBe("testuser");
    expect(result?.value.user.birthday).toBe("19900101");
    expect(result?.value.accessToken).toBeTruthy();
    expect(result?.value.refreshToken).toBeTruthy();
    expect(repository.createUserWithLogin).toHaveBeenCalledTimes(1);
  });

  it("名前が重複している場合、nullを返し、ユーザーを作成しないこと", async () => {
    const repository = createRepository(true);
    const usecase = new CreateUserUsecase(repository, testConfig);

    const result = await usecase.execute("testuser", "19900101", "password");

    expect(result).toBeNull();
    expect(repository.createUserWithLogin).not.toHaveBeenCalled();
  });

  it("名前が空の場合、例外になり、ユーザーを作成しないこと", async () => {
    const repository = createRepository(false);
    const usecase = new CreateUserUsecase(repository, testConfig);

    await expect(usecase.execute("", "19900101", "password")).rejects.toThrow();
    expect(repository.createUserWithLogin).not.toHaveBeenCalled();
  });

  it("生年月日が不正な場合、例外になり、ユーザーを作成しないこと", async () => {
    const repository = createRepository(false);
    const usecase = new CreateUserUsecase(repository, testConfig);

    await expect(usecase.execute("testuser", "19990229", "password")).rejects.toThrow();
    expect(repository.createUserWithLogin).not.toHaveBeenCalled();
  });
});
