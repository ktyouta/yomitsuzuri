import { err, ok, Result } from "neverthrow";
import type { CharacterAgeError, CharacterCharacteristicError, CharacterMemoError, CharacterNameError, CharacterNameUniquenessDomainService, CharacterOccupationError, GenderIdError, GenderValidityDomainService, IUpdateCharacterRepository } from "../../../../domain/book";
import { CharacterAge, CharacterCharacteristic, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { UpdateCharacterResultDto } from "../../dto";

/**
 * 登場人物更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateCharacterInputError =
  | { field: "name"; error: CharacterNameError }
  | { field: "age"; error: CharacterAgeError }
  | { field: "genderId"; error: GenderIdError }
  | { field: "occupation"; error: CharacterOccupationError }
  | { field: "characteristic"; error: CharacterCharacteristicError }
  | { field: "memo"; error: CharacterMemoError };

export type UpdateCharacterError =
  | { type: "INVALID_INPUT"; errors: UpdateCharacterInputError[] }
  | { type: "NOT_FOUND" }
  | { type: "INVALID_GENDER" }
  | { type: "DUPLICATE_NAME" };

type UpdateCharacterBody = {
  name: string;
  age?: string | null;
  genderId?: number | null;
  occupation?: string | null;
  characteristic?: string | null;
  memo?: string | null;
};

type PropsType = {
  userId: UserId;
  characterId: string;
  body: UpdateCharacterBody;
}

/**
 * 登場人物更新ユースケース
 */
export class UpdateCharacterUsecase {
  constructor(private readonly updateCharacterRepository: IUpdateCharacterRepository,
    private readonly uniquenessService: CharacterNameUniquenessDomainService,
    private readonly genderValidityService: GenderValidityDomainService,
  ) { }

  /**
   * 登場人物更新（名前・年齢・性別・職業・特徴・メモを置き換える。ID・作品・削除フラグは変えない）
   * @param userId 書籍を所有するユーザーID
   * @param characterId 更新する登場人物ID
   * @param body 登場人物の更新内容
   * @returns 成功時は更新した登場人物の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・登場人物が存在しない（他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みを含む）・
   * 性別が無効・作品内に自身以外の同名の登場人物が存在する場合はエラー（いずれも保存しない）
   * @throws characterId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterId, body }: PropsType): Promise<Result<UpdateCharacterResultDto, UpdateCharacterError>> {
    const id = CharacterId.of(characterId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      CharacterName.create(body.name).mapErr((error): UpdateCharacterInputError => ({ field: "name", error })),
      CharacterAge.create(body.age).mapErr((error): UpdateCharacterInputError => ({ field: "age", error })),
      GenderId.create(body.genderId).mapErr((error): UpdateCharacterInputError => ({ field: "genderId", error })),
      CharacterOccupation.create(body.occupation).mapErr((error): UpdateCharacterInputError => ({ field: "occupation", error })),
      CharacterCharacteristic.create(body.characteristic).mapErr((error): UpdateCharacterInputError => ({ field: "characteristic", error })),
      CharacterMemo.create(body.memo).mapErr((error): UpdateCharacterInputError => ({ field: "memo", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [name, age, genderId, occupation, characteristic, memo] = input.value;

    // 登場人物の存在・所有者チェック
    const character = await this.updateCharacterRepository.findCharacter(userId, id);
    if (!character) {
      return err({ type: "NOT_FOUND" });
    }

    // 性別の実在・有効性チェック（gender_master が唯一の真実源のため、値オブジェクトではなくここで判定する）
    if (!(await this.genderValidityService.isValid(genderId))) {
      return err({ type: "INVALID_GENDER" });
    }

    // 作品内の名前重複（自身は除外する）
    if (await this.uniquenessService.isDuplicated(userId, character.workId, character.id, name)) {
      return err({ type: "DUPLICATE_NAME" });
    }

    character.update({ name, age, genderId, occupation, characteristic, memo });

    await this.updateCharacterRepository.updateCharacter(character);

    return ok(new UpdateCharacterResultDto(character));
  }
}
