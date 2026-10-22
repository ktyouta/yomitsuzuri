import { err, ok, Result } from "neverthrow";
import type { CharacterAgeError, CharacterCharacteristicError, CharacterMemoError, CharacterNameError, CharacterNameUniquenessDomainService, CharacterOccupationError, GenderIdError, GenderValidityDomainService, ICreateCharacterRepository } from "../../../../domain/book";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import { CreateCharacterResultDto } from "../../dto";

/**
 * 登場人物作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateCharacterInputError =
  | { field: "name"; error: CharacterNameError }
  | { field: "age"; error: CharacterAgeError }
  | { field: "genderId"; error: GenderIdError }
  | { field: "occupation"; error: CharacterOccupationError }
  | { field: "characteristic"; error: CharacterCharacteristicError }
  | { field: "memo"; error: CharacterMemoError };

export type CreateCharacterError =
  | { type: "INVALID_INPUT"; errors: CreateCharacterInputError[] }
  | { type: "NOT_FOUND" }
  | { type: "INVALID_GENDER" }
  | { type: "DUPLICATE_NAME" };

type CreateCharacterBody = {
  name: string;
  age?: string | null;
  genderId?: number | null;
  occupation?: string | null;
  characteristic?: string | null;
  memo?: string | null;
};

type PropsType = {
  userId: UserId;
  workId: string;
  body: CreateCharacterBody;
}

/**
 * 登場人物作成ユースケース
 */
export class CreateCharacterUsecase {
  constructor(private readonly createCharacterRepository: ICreateCharacterRepository,
    private readonly uniquenessService: CharacterNameUniquenessDomainService,
    private readonly genderValidityService: GenderValidityDomainService,
  ) { }

  /**
   * 登場人物作成
   * @param userId 書籍を所有するユーザーID
   * @param workId 登場人物を追加する作品ID
   * @param body 登場人物の登録内容
   * @returns 成功時は作成した登場人物の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・作品が存在しない（他ユーザーの書籍の作品・作品または書籍が論理削除済みを含む）・
   * 性別が無効・作品内に同名の登場人物が存在する場合はエラー（いずれも保存しない）
   * @throws workId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, workId, body }: PropsType): Promise<Result<CreateCharacterResultDto, CreateCharacterError>> {
    const id = WorkId.of(workId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      CharacterName.create(body.name).mapErr((error): CreateCharacterInputError => ({ field: "name", error })),
      CharacterAge.create(body.age).mapErr((error): CreateCharacterInputError => ({ field: "age", error })),
      GenderId.create(body.genderId).mapErr((error): CreateCharacterInputError => ({ field: "genderId", error })),
      CharacterOccupation.create(body.occupation).mapErr((error): CreateCharacterInputError => ({ field: "occupation", error })),
      CharacterCharacteristic.create(body.characteristic).mapErr((error): CreateCharacterInputError => ({ field: "characteristic", error })),
      CharacterMemo.create(body.memo).mapErr((error): CreateCharacterInputError => ({ field: "memo", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [name, age, genderId, occupation, characteristic, memo] = input.value;

    // 作品の存在・所有者チェック
    if (!(await this.createCharacterRepository.findWork(userId, id))) {
      return err({ type: "NOT_FOUND" });
    }

    // 性別の実在・有効性チェック（gender_master が唯一の真実源のため、値オブジェクトではなくここで判定する）
    if (!(await this.genderValidityService.isValid(genderId))) {
      return err({ type: "INVALID_GENDER" });
    }

    const character = CharacterEntity.create({ workId: id, name, age, genderId, occupation, characteristic, memo });

    // 作品内の名前重複
    if (await this.uniquenessService.isDuplicated(userId, id, character.id, name)) {
      return err({ type: "DUPLICATE_NAME" });
    }

    await this.createCharacterRepository.createCharacter(character);

    return ok(new CreateCharacterResultDto(character));
  }
}
