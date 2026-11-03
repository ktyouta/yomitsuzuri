import { err, ok, Result } from "neverthrow";
import { CharacterId, CharacterRelationId, CharacterRelationName, CharacterRelationUniquenessDomainService, CharacterValidityDomainService, UserId, type CharacterField, type CharacterIdError, type CharacterRelationNameError, type IUpdateCharacterRelationRepository } from "../../../../domain";
import { UpdateCharacterRelationResultDto } from "../../dto";

/**
 * 登場人物関係更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateCharacterRelationInputError =
  | { field: "characterId"; error: CharacterIdError }
  | { field: "targetCharacterId"; error: CharacterIdError }
  | { field: "relationName"; error: CharacterRelationNameError };

export type UpdateCharacterRelationError =
  | { type: "INVALID_INPUT"; errors: UpdateCharacterRelationInputError[] }
  | { type: "NOT_FOUND" }
  | { type: "CHARACTER_RELATION_SELF" }
  | { type: "INVALID_CHARACTER"; fields: CharacterField[] }
  | { type: "DUPLICATE_RELATION" };

type UpdateCharacterRelationBody = {
  characterId: string;
  targetCharacterId: string;
  relationName: string;
};

type PropsType = {
  userId: UserId;
  characterRelationId: string;
  body: UpdateCharacterRelationBody;
};

/**
 * 登場人物関係更新ユースケース
 */
export class UpdateCharacterRelationUsecase {
  constructor(private readonly updateCharacterRelationRepository: IUpdateCharacterRelationRepository,
    private readonly characterValidityDomainService: CharacterValidityDomainService,
    private readonly characterRelationUniquenessDomainService: CharacterRelationUniquenessDomainService,
  ) { }

  /**
   * 登場人物関係更新
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 更新する登場人物関係ID
   * @param body 更新後の登場人物関係の内容
   * @returns 成功時は更新した登場人物関係の DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・登場人物関係が存在しない（他ユーザーの書籍の登場人物関係・登場人物関係、変更前の人物または相手、作品、書籍が論理削除済みを含む）・
   * 変更後の人物と相手が同じ・変更後の人物または相手がその作品の削除されていない登場人物ではない・変更後の2人の間（向きを問わない）に同じ関係名の別の関係が存在する場合はエラー（いずれも保存しない）
   * @throws characterRelationId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterRelationId, body }: PropsType): Promise<Result<UpdateCharacterRelationResultDto, UpdateCharacterRelationError>> {
    const id = CharacterRelationId.of(characterRelationId);

    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      CharacterId.fromInput(body.characterId).mapErr((error): UpdateCharacterRelationInputError => ({ field: "characterId", error })),
      CharacterId.fromInput(body.targetCharacterId).mapErr((error): UpdateCharacterRelationInputError => ({ field: "targetCharacterId", error })),
      CharacterRelationName.create(body.relationName).mapErr((error): UpdateCharacterRelationInputError => ({ field: "relationName", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [characterId, targetCharacterId, relationName] = input.value;

    // 登場人物関係の存在・所有者チェック
    const characterRelation = await this.updateCharacterRelationRepository.findCharacterRelation(userId, id);
    if (!characterRelation) {
      return err({ type: "NOT_FOUND" });
    }

    const updateResult = characterRelation.update({
      characterId,
      targetCharacterId,
      relationName
    });

    // 人物と相手が同じ登場人物かを判定
    if (updateResult.isErr()) {
      return err({ type: "CHARACTER_RELATION_SELF" });
    }

    // 人物・相手がその作品の削除されていない登場人物か
    const invalidFields = await this.characterValidityDomainService.findInvalidFields(userId, characterRelation);
    if (invalidFields.length > 0) {
      return err({ type: "INVALID_CHARACTER", fields: invalidFields });
    }

    // 同じ2人の間（向きを問わない）の関係名の重複
    if (await this.characterRelationUniquenessDomainService.isDuplicated(userId, characterRelation)) {
      return err({ type: "DUPLICATE_RELATION" });
    }

    await this.updateCharacterRelationRepository.updateCharacterRelation(characterRelation);

    return ok(new UpdateCharacterRelationResultDto(characterRelation));
  }
}
