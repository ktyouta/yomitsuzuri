import { describe, it, expect } from "vitest";
import { GetListSampleEntity } from "../../../../src/domain/sample";
import { GetListSampleResponseDto } from "../../../../src/presentation/sample/dto";

describe("GetListSampleResponseDto (get-list)", () => {
  it("エンティティ配列からDTO配列を生成できること", () => {
    const entities = [
      new GetListSampleEntity(1, "テスト1", "説明1", "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"),
      new GetListSampleEntity(2, "テスト2", null, "2024-01-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z"),
    ];

    const dto = new GetListSampleResponseDto(entities);

    expect(dto.value).toHaveLength(2);
    expect(dto.value[0].name).toBe("テスト1");
    expect(dto.value[1].name).toBe("テスト2");
    expect(dto.value[1].description).toBeNull();
  });
});
