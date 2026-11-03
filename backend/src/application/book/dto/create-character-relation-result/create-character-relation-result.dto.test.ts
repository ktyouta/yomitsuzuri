import { describe, expect, it } from "vitest";
import { CreateCharacterRelationResultDto } from "..";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, WorkId } from "../../../../domain/book";

describe("CreateCharacterRelationResultDto", () => {
  it("登場人物関係からDTOを生成できること（削除フラグは含めない）", () => {
    const characterRelation = CharacterRelationEntity.reconstruct({
      id: CharacterRelationId.of("01BX5ZZKBKACTAV9WEVGEMMVR0"),
      workId: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"),
      characterId: CharacterId.of("01BX5ZZKBKACTAV9WEVGEMMVC0"),
      targetCharacterId: CharacterId.of("01BX5ZZKBKACTAV9WEVGEMMVC1"),
      relationName: CharacterRelationName.of("兄"),
      deleteFlg: false,
    });

    const dto = new CreateCharacterRelationResultDto(characterRelation);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVR0",
      workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      characterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
      targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC1",
      relationName: "兄",
    });
  });
});
