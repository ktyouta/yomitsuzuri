import { describe, it, expect } from "vitest";
import { GetCharacterResultDto } from "..";
import type { CharacterDetail, CharacterDetailRelationItem } from "../../../../domain";

const CHARACTER: CharacterDetail = {
  id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
  workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
  name: "山田太郎",
  age: "30代",
  genderId: 1,
  genderLabel: "男性",
  occupation: "探偵",
  characteristic: "左利き",
  memo: "依頼人と以前から知り合い？",
  updatedAt: "2026-10-01T00:00:00.000Z",
  deleteFlg: false,
};

describe("GetCharacterResultDto", () => {
  it("登場人物と関係一覧からDTOを生成できること", () => {
    const relations: CharacterDetailRelationItem[] = [
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVR0",
        characterId: "01BX5ZZKBKACTAV9WEVGEMMVT0",
        characterName: "山田太郎",
        targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVT1",
        targetCharacterName: "佐藤花子",
        relationName: "依頼人",
      },
    ];

    const dto = new GetCharacterResultDto(CHARACTER, relations);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      name: "山田太郎",
      age: "30代",
      genderId: 1,
      genderLabel: "男性",
      occupation: "探偵",
      characteristic: "左利き",
      memo: "依頼人と以前から知り合い？",
      updatedAt: "2026-10-01T00:00:00.000Z",
      deleteFlg: false,
      relations: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVR0",
          characterId: "01BX5ZZKBKACTAV9WEVGEMMVT0",
          characterName: "山田太郎",
          targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVT1",
          targetCharacterName: "佐藤花子",
          relationName: "依頼人",
        },
      ],
    });
  });

  it("関係が0件の場合、空の関係一覧を返すこと", () => {
    const dto = new GetCharacterResultDto(CHARACTER, []);

    expect(dto.value.relations).toEqual([]);
  });
});
