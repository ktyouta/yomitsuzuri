import { describe, expect, it } from "vitest";
import { UpdateWorkResultDto } from "..";
import { IconId, Timestamp, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../../../domain";

describe("UpdateWorkResultDto", () => {
  it("作品から、更新日時を含むすべての項目でDTOを生成できること", () => {
    const work = WorkEntity.reconstruct({
      id: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"),
      title: WorkTitle.of("作品1"),
      sort: WorkSort.of(1),
      memo: WorkMemo.of("作品メモ"),
      iconId: IconId.of(4),
      deleteFlg: false,
      updatedAt: Timestamp.of("2026-01-02T00:00:00.000Z"),
    });

    const dto = new UpdateWorkResultDto(work);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      title: "作品1",
      sort: 1,
      memo: "作品メモ",
      iconId: 4,
      deleteFlg: false,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });
});
