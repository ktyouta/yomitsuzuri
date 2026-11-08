import { describe, it, expect } from "vitest";
import { GetListCharacterRelationResultDto } from "..";
import type { CharacterRelationListItem } from "../../../../domain";

describe("GetListCharacterRelationResultDto", () => {
  it("登場人物関係一覧からDTOを生成できること", () => {
    const list: CharacterRelationListItem[] = [
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
        characterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
        characterName: "山田",
        targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC1",
        targetCharacterName: "佐藤",
        relationName: "兄",
      },
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
        characterId: "01BX5ZZKBKACTAV9WEVGEMMVC2",
        characterName: "鈴木",
        targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
        targetCharacterName: "山田",
        relationName: "上司",
      },
    ];

    const dto = new GetListCharacterRelationResultDto(list);

    expect(dto.value).toEqual({
      list: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
          characterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
          characterName: "山田",
          targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC1",
          targetCharacterName: "佐藤",
          relationName: "兄",
        },
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
          characterId: "01BX5ZZKBKACTAV9WEVGEMMVC2",
          characterName: "鈴木",
          targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
          targetCharacterName: "山田",
          relationName: "上司",
        },
      ],
    });
  });
});
