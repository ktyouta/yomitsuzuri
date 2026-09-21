import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetSampleEntity } from "../../../../src/domain/sample";
import { GetSampleUsecase } from "../../../../src/application/sample";
import type { IGetSampleRepository } from "../../../../src/domain/sample";

describe("GetSampleUsecase (get)", () => {
  let mockRepository: IGetSampleRepository;
  let usecase: GetSampleUsecase;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
    };
    usecase = new GetSampleUsecase(mockRepository);
  });

  it("findById - 存在する場合にエンティティを返すこと", async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(
      new GetSampleEntity(
        1,
        "テスト",
        "説明",
        "2024-01-01T00:00:00.000Z",
        "2024-01-01T00:00:00.000Z"
      )
    );

    const result = await usecase.execute(1);

    expect(result).toBeInstanceOf(GetSampleEntity);
    expect(result?.id).toBe(1);
  });

  it("findById - 存在しない場合にnullを返すこと", async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(undefined);

    const result = await usecase.execute(999);

    expect(result).toBeNull();
  });
});
