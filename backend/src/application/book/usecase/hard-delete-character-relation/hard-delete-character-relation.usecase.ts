import { err, ok, Result } from "neverthrow";
import { CharacterRelationId, type IHardDeleteCharacterRelationRepository, type UserId } from "../../../../domain";

export type HardDeleteCharacterRelationError =
  { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  characterRelationId: string;
}

/**
 * 登場人物関係の物理削除ユースケース
 */
export class HardDeleteCharacterRelationUsecase {
  constructor(private readonly hardDeleteCharacterRelationRepository: IHardDeleteCharacterRelationRepository) { }

  /**
   * 登場人物関係の物理削除
   * 論理削除済みの登場人物関係を物理削除する。
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 物理削除の対象の登場人物関係ID
   * @returns 成功時は ok。
   * 削除済みの登場人物関係が存在しない（削除されていない登場人物関係・他ユーザーの書籍の登場人物関係を含む）場合は NOT_FOUND（削除しない）
   * @throws characterRelationId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterRelationId }: PropsType): Promise<Result<undefined, HardDeleteCharacterRelationError>> {
    const id = CharacterRelationId.of(characterRelationId);

    // 物理削除（削除済みの登場人物関係の存在・所有者は削除の条件で確認する）
    const deleted = await this.hardDeleteCharacterRelationRepository.deleteCharacterRelation(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
