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

    get id() {
        return this._id;
    }

    get workId() {
        return this._workId;
    }

    get name() {
        return this._name;
    }

    get age() {
        return this._age;
    }

    get genderId() {
        return this._genderId;
    }

    get occupation() {
        return this._occupation;
    }

    get characteristic() {
        return this._characteristic;
    }

    get memo() {
        return this._memo;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }
}
