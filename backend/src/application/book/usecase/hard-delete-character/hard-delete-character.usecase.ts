import { err, ok, Result } from "neverthrow";
import { CharacterId, type IHardDeleteCharacterRepository, type UserId } from "../../../../domain";

export type HardDeleteCharacterError =
  { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  characterId: string;
}

/**
 * 登場人物の物理削除ユースケース
 */
export class HardDeleteCharacterUsecase {
  constructor(private readonly hardDeleteCharacterRepository: IHardDeleteCharacterRepository) { }

  /**
   * 登場人物の物理削除
   * 論理削除済みの登場人物と、登場人物が人物または相手として関わる人物関係を物理削除する。
   * @param userId 書籍を所有するユーザーID
   * @param characterId 物理削除の対象の登場人物ID
   * @returns 成功時は ok。
   * 削除済みの登場人物が存在しない（削除されていない登場人物・他ユーザーの書籍の登場人物を含む）場合は NOT_FOUND（削除しない）
   * @throws characterId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterId }: PropsType): Promise<Result<undefined, HardDeleteCharacterError>> {
    const id = CharacterId.of(characterId);

    // 物理削除（削除済みの登場人物の存在・所有者は削除の条件で確認する）
    const deleted = await this.hardDeleteCharacterRepository.deleteCharacter(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
