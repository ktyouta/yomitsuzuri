import { describe, it, expect } from "vitest";
import { GetListCharacterResultDto } from "..";
import type { CharacterListItem } from "../../../../domain/book";

describe("GetListCharacterResultDto", () => {
  it("登場人物一覧からDTOを生成できること", () => {
    const list: CharacterListItem[] = [
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
        name: "石神哲哉",
        age: "40代",
        occupation: null,
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
    ];

    const dto = new GetListCharacterResultDto(list);

    expect(dto.value).toEqual({
      list: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
          name: "石神哲哉",
          age: "40代",
          occupation: null,
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });
  });
});
