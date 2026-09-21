import { describe, it, expect } from "vitest";
import { GetListSampleEntity } from "../../../../src/domain/sample";

describe("GetListSampleEntity (get-list)", () => {
  it("fromRecordでエンティティを生成できること", () => {
    const record = {
      id: 1,
      name: "テスト",
      description: "説明",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const entity = GetListSampleEntity.fromRecord(record);

    expect(entity.id).toBe(1);
    expect(entity.name).toBe("テスト");
    expect(entity.description).toBe("説明");
  });
});
