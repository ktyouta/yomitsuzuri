import type { CharacterAge, CharacterCharacteristic, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId } from "../../value-object";

export class CharacterEntity {

    constructor(private readonly _id: CharacterId,
        private readonly _workId: WorkId,
        private readonly _name: CharacterName,
        private readonly _age: CharacterAge,
        private readonly _genderId: GenderId,
        private readonly _occupation: CharacterOccupation,
        private readonly _characteristic: CharacterCharacteristic,
        private readonly _memo: CharacterMemo,
        private readonly _deleteFlg: boolean,
    ) { }
}
