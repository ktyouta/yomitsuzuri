import { err, ok, Result } from "neverthrow";
import { CharacterId, CharacterRelationEntity, CharacterRelationName, CharacterRelationUniquenessDomainService, CharacterValidityDomainService, UserId, WorkId, type CharacterField, type CharacterIdError, type CharacterRelationNameError, type ICreateCharacterRelationRepository } from "../../../../domain";
import { CreateCharacterRelationResultDto } from "../../dto";

/**
 * 登場人物関係作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateCharacterRelationInputError =
  | { field: "characterId"; error: CharacterIdError }
  | { field: "targetCharacterId"; error: CharacterIdError }
  | { field: "relationName"; error: CharacterRelationNameError };

export type CreateCharacterRelationError =
  | { type: "INVALID_INPUT"; errors: CreateCharacterRelationInputError[] }
  | { type: "NOT_FOUND" }
  | { type: "CHARACTER_RELATION_SELF" }
  | { type: "INVALID_CHARACTER"; fields: CharacterField[] }
  | { type: "DUPLICATE_RELATION" };

type CreateCharacterRelationBody = {
  characterId: string;
  targetCharacterId: string;
  relationName: string;
};

type PropsType = {
  userId: UserId;
  workId: string;
  body: CreateCharacterRelationBody;
};

/**
 * 登場人物関係作成ユースケース
 */
export class CreateCharacterRelationUsecase {
  constructor(private readonly createCharacterRelationRepository: ICreateCharacterRelationRepository,
    private readonly characterValidityDomainService: CharacterValidityDomainService,
    private readonly characterRelationUniquenessDomainService: CharacterRelationUniquenessDomainService,
  ) { }

  /**
   * 登場人物関係作成
   * @param userId 書籍を所有するユーザーID
   * @param workId 登場人物関係を追加する作品ID
   * @param body 登場人物関係の登録内容
   * @returns 成功時は作成した登場人物関係の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・作品が存在しない（他ユーザーの書籍の作品・作品または書籍が論理削除済みを含む）・
   * 人物と相手が同じ・人物または相手がその作品の削除されていない登場人物ではない・同じ2人の間（向きを問わない）に同じ関係名の関係が存在する場合はエラー（いずれも保存しない）
   * @throws workId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, workId, body }: PropsType): Promise<Result<CreateCharacterRelationResultDto, CreateCharacterRelationError>> {
    const id = WorkId.of(workId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      CharacterId.fromInput(body.characterId).mapErr((error): CreateCharacterRelationInputError => ({ field: "characterId", error })),
      CharacterId.fromInput(body.targetCharacterId).mapErr((error): CreateCharacterRelationInputError => ({ field: "targetCharacterId", error })),
      CharacterRelationName.create(body.relationName).mapErr((error): CreateCharacterRelationInputError => ({ field: "relationName", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [characterId, targetCharacterId, relationName] = input.value;

    // 作品の存在・所有者チェック
    if (!(await this.createCharacterRelationRepository.findWork(userId, id))) {
      return err({ type: "NOT_FOUND" });
    }

    const characterRelationResult = CharacterRelationEntity.create({
      workId: id,
      characterId,
      targetCharacterId,
      relationName
    });

    // 人物と相手が同じ登場人物かを判定
    if (characterRelationResult.isErr()) {
      return err({ type: "CHARACTER_RELATION_SELF" });
    }

    const characterRelation = characterRelationResult.value;
    // 人物・相手がその作品の削除されていない登場人物か
    const invalidFields = await this.characterValidityDomainService.findInvalidFields(userId, characterRelation);
    if (invalidFields.length > 0) {
      return err({ type: "INVALID_CHARACTER", fields: invalidFields });
    }

    // 同じ2人の間（向きを問わない）の関係名の重複
    if (await this.characterRelationUniquenessDomainService.isDuplicated(userId, characterRelation)) {
      return err({ type: "DUPLICATE_RELATION" });
    }

    await this.createCharacterRelationRepository.createCharacterRelation(characterRelation);

    return ok(new CreateCharacterRelationResultDto(characterRelation));
  }
}
