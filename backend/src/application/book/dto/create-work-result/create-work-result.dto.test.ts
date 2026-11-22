import { describe, expect, it } from "vitest";
import { CreateWorkResultDto } from "..";
import { IconId, Timestamp, WorkEntity, WorkMemo, WorkSort, WorkTitle } from "../../../../domain";

describe("CreateWorkResultDto", () => {
  it("作品から、更新日時を含むすべての項目でDTOを生成できること", () => {
    const work = WorkEntity.create({
      title: WorkTitle.of("作品1"),
      sort: WorkSort.of(3),
      memo: WorkMemo.of("作品メモ"),
      iconId: IconId.of(4),
      updatedAt: Timestamp.of("2026-01-02T00:00:00.000Z"),
    });

    const dto = new CreateWorkResultDto(work);

    expect(dto.value).toEqual({
      id: work.id.value,
      title: "作品1",
      sort: 3,
      memo: "作品メモ",
      iconId: 4,
      deleteFlg: false,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });
});
