import { describe, it, expect } from "vitest";
import { UpdateCharacterResultDto } from "..";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId } from "../../../../domain/book";

describe("UpdateCharacterResultDto", () => {
  it("登場人物からDTOを生成できること", () => {
    const character = CharacterEntity.reconstruct({
      id: CharacterId.of("01BX5ZZKBKACTAV9WEVGEMMVT0"),
      workId: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"),
      name: CharacterName.of("石神哲哉"),
      age: CharacterAge.of("40代"),
      genderId: GenderId.of(1),
      occupation: CharacterOccupation.of("数学教師"),
      characteristic: CharacterCharacteristic.of(null),
      memo: CharacterMemo.of("メモ"),
      deleteFlg: false,
    });

    const dto = new UpdateCharacterResultDto(character);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      name: "石神哲哉",
      age: "40代",
      genderId: 1,
      occupation: "数学教師",
      characteristic: null,
      memo: "メモ",
    });
  });
});
