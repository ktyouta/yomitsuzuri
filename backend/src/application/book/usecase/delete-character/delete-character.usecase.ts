import { err, ok, Result } from "neverthrow";
import { CharacterId, type IDeleteCharacterRepository, type UserId } from "../../../../domain";

export type DeleteCharacterError =
  | { type: "NOT_FOUND" }
  | { type: "EXISTS_RELATIONS" };

type PropsType = {
  userId: UserId;
  characterId: string;
}

/**
 * 登場人物削除ユースケース
 */
export class DeleteCharacterUsecase {
  constructor(private readonly deleteCharacterRepository: IDeleteCharacterRepository,) { }

  /**
   * 登場人物削除（論理削除する）
   * @param userId 書籍を所有するユーザーID
   * @param characterId 削除する登場人物ID
   * @returns 成功時は ok。
   * 登場人物が存在しない（他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みを含む）場合は NOT_FOUND、
   * 登場人物が人物または相手として関わる、削除されていない人物関係が残っている場合は EXISTS_RELATIONS（いずれも保存しない）
   * @throws characterId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterId }: PropsType): Promise<Result<undefined, DeleteCharacterError>> {
    const id = CharacterId.of(characterId);

    // 登場人物の存在・所有者チェック
    const character = await this.deleteCharacterRepository.findCharacter(userId, id);
    if (!character) {
      return err({ type: "NOT_FOUND" });
    }

    // 人物関係存在チェック
    const relations = await this.deleteCharacterRepository.findCharacterRelationList(userId, id);
    if (relations.length > 0) {
      return err({ type: "EXISTS_RELATIONS" });
    }

    character.delete();

    await this.deleteCharacterRepository.deleteCharacter(character);

    return ok(undefined);
  }
}
