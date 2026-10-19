import { describe, it, expect, vi } from "vitest";
import { UserName, UserNameUniquenessDomainService, type IUserNameUniquenessRepository } from "../../..";
import { UserId } from "../../../shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const USER_NAME = UserName.of("testuser");

function createRepository(result: { id: string }[]) {
  return {
    findUser: vi.fn<IUserNameUniquenessRepository["findUser"]>().mockResolvedValue(result),
  } satisfies IUserNameUniquenessRepository;
}

describe("UserNameUniquenessDomainService", () => {
  it("同名ユーザーが1件以上ある場合、true を返すこと", async () => {
    const service = new UserNameUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }]));
    expect(await service.isDuplicated(USER_ID, USER_NAME)).toBe(true);
  });

  it("同名ユーザーが0件の場合、false を返すこと", async () => {
    const service = new UserNameUniquenessDomainService(createRepository([]));
    expect(await service.isDuplicated(USER_ID, USER_NAME)).toBe(false);
  });

  it("渡したユーザーID・ユーザー名で Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new UserNameUniquenessDomainService(repository);
    await service.isDuplicated(USER_ID, USER_NAME);
    expect(repository.findUser).toHaveBeenCalledWith(USER_ID, USER_NAME);
  });
});
