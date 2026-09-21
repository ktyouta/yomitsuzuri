import { describe, it, expect } from "vitest";
import { GetSampleEntity } from "../../../../src/domain/sample";
import { GetSampleResponseDto } from "../../../../src/presentation/sample/dto";

describe("GetSampleResponseDto (get)", () => {
  it("エンティティからDTOを生成できること", () => {
    const entity = new GetSampleEntity(
      1,
      "テスト",
      "説明",
      "2024-01-01T00:00:00.000Z",
      "2024-01-01T00:00:00.000Z"
    );

    const dto = new GetSampleResponseDto(entity);

    expect(dto.value.id).toBe(1);
    expect(dto.value.name).toBe("テスト");
    expect(dto.value.description).toBe("説明");
  });
});
