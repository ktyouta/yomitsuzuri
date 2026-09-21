import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetListSampleEntity } from "../../../../src/domain/sample";
import { GetListSampleUsecase } from "../../../../src/application/sample";
import type { IGetListSampleRepository } from "../../../../src/domain/sample";

describe("GetListSampleUsecase (get-list)", () => {
  let mockRepository: IGetListSampleRepository;
  let usecase: GetListSampleUsecase;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
    };
    usecase = new GetListSampleUsecase(mockRepository);
  });

  it("findAll - 全件取得できること", async () => {
    vi.mocked(mockRepository.findAll).mockResolvedValue([
      new GetListSampleEntity(
        1,
        "テスト",
        "説明",
        "2024-01-01T00:00:00.000Z",
        "2024-01-01T00:00:00.000Z"
      ),
    ]);

    const result = await usecase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(GetListSampleEntity);
  });
});
