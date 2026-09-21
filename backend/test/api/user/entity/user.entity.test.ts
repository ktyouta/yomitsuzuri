import { describe, it, expect } from "vitest";
import { UserEntity, UserId, UserName, UserBirthday } from "../../../../src/domain";

describe("UserEntity", () => {
  it("エンティティを生成できること", () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const userName = new UserName("testuser");
    const userBirthday = new UserBirthday("19900101");

    const entity = new UserEntity(userId, userName, userBirthday);

    expect(entity.userId).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(entity.userName).toBe("testuser");
    expect(entity.userBirthday).toBe("19900101");
  });
});
