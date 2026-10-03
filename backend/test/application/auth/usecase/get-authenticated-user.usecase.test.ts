import { describe, it, expect, vi } from "vitest";
import { GetAuthenticatedUserUsecase } from "../../../../src/application/auth/usecase";
import { UserId } from "../../../../src/domain/user";
import type { IGetUserProfileRepository, UserProfile } from "../../../../src/domain/user";

const PROFILE: UserProfile = {
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "testuser",
  birthday: "19900101",
  darkMode: true,
};

function createRepository(profile: UserProfile | undefined) {
  return {
    findById: vi.fn<IGetUserProfileRepository["findById"]>().mockResolvedValue(profile),
  } satisfies IGetUserProfileRepository;
}

describe("GetAuthenticatedUserUsecase", () => {
  it("ユーザーが存在する場合、プロフィールを含む結果を返すこと", async () => {
    const usecase = new GetAuthenticatedUserUsecase(createRepository(PROFILE));

    const result = await usecase.execute(UserId.of(PROFILE.id));

    expect(result?.value).toEqual(PROFILE);
  });

  it("ユーザーが存在しない場合、undefinedを返すこと", async () => {
    const usecase = new GetAuthenticatedUserUsecase(createRepository(undefined));

    const result = await usecase.execute(UserId.of(PROFILE.id));

    expect(result).toBeUndefined();
  });
});
