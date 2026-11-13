import { err, ok, Result } from "neverthrow";
import { CharacterRelationId, CharacterValidityDomainService, type IRestoreCharacterRelationRepository, type UserId } from "../../../../domain";
import { RestoreCharacterRelationResultDto } from "../../dto";

export type RestoreCharacterRelationError =
  | { type: "NOT_FOUND" }
  | { type: "DELETED_CHARACTER" };

type PropsType = {
  userId: UserId;
  characterRelationId: string;
};

/**
 * 登場人物関係復元ユースケース
 */
export class RestoreCharacterRelationUsecase {
  constructor(
    private readonly restoreCharacterRelationRepository: IRestoreCharacterRelationRepository,
    private readonly characterValidityDomainService: CharacterValidityDomainService,
  ) { }

  /**
   * 登場人物関係復元（論理削除を解除する）
   * 同じ関係の重複は判定しない（登録・更新で削除済みも重複の対象にしているため、復元で重複は生じない）。
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 復元する登場人物関係ID
   * @returns 成功時は復元した登場人物関係の DTO。
   * 削除済みの登場人物関係が存在しない（削除されていない登場人物関係・他ユーザーの書籍の登場人物関係・作品または書籍が論理削除済みを含む）場合は NOT_FOUND、
   * 人物または相手がその作品の削除されていない登場人物ではない場合は DELETED_CHARACTER（いずれも保存しない）
   * @throws characterRelationId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterRelationId }: PropsType): Promise<Result<RestoreCharacterRelationResultDto, RestoreCharacterRelationError>> {
    const id = CharacterRelationId.of(characterRelationId);

    // 削除済みの登場人物関係の存在・所有者チェック
    const characterRelation = await this.restoreCharacterRelationRepository.findCharacterRelation(userId, id);
    if (!characterRelation) {
      return err({ type: "NOT_FOUND" });
    }

    // 削除された登場人物との関係を復元させない
    const invalidFields = await this.characterValidityDomainService.findInvalidFields(userId, characterRelation);
    if (invalidFields.length > 0) {
      return err({ type: "DELETED_CHARACTER" });
    }

    characterRelation.restore();

    await this.restoreCharacterRelationRepository.restoreCharacterRelation(characterRelation);

    return ok(new RestoreCharacterRelationResultDto(characterRelation));
  }
}
