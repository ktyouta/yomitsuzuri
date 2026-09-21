import { describe, it, expect } from "vitest";
import { CreateUserResponseDto } from "../../../../src/presentation/user/dto";
import { UserEntity, UserId, UserName, UserBirthday } from "../../../../src/domain";

describe("CreateUserResponseDto", () => {
  it("エンティティからDTOを生成できること", () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const userName = new UserName("testuser");
    const userBirthday = new UserBirthday("19900101");
    const entity = new UserEntity(userId, userName, userBirthday);
    const accessToken = "test-access-token";

    const dto = new CreateUserResponseDto(entity, accessToken);

    expect(dto.value.accessToken).toBe("test-access-token");
    expect(dto.value.user.id).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(dto.value.user.name).toBe("testuser");
    expect(dto.value.user.birthday).toBe("19900101");
    expect(dto.value.user.darkMode).toBe(false);
  });
});
