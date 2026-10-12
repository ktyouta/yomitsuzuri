import { describe, expect, it } from "vitest";
import { GetWorkResultDto } from "..";
import type { WorkType } from "../../../../domain/book";

describe("GetWorkResultDto", () => {
  it("作品情報からDTOを生成できること", () => {
    const work: WorkType = {
      id: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      title: "作品1",
      memo: "作品メモ",
      iconId: 4,
      icon: "📗",
      updatedAt: "2026-10-01T00:00:00.000Z",
    };

    const dto = new GetWorkResultDto(work);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      title: "作品1",
      memo: "作品メモ",
      iconId: 4,
      icon: "📗",
      updatedAt: "2026-10-01T00:00:00.000Z",
    });
  });
});
