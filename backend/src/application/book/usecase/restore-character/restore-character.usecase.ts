import { err, ok, Result } from "neverthrow";
import { CharacterId, type IRestoreCharacterRepository, type UserId } from "../../../../domain";
import { RestoreCharacterResultDto } from "../../dto";

export type RestoreCharacterError =
  { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  characterId: string;
}

/**
 * 登場人物復元ユースケース
 */
export class RestoreCharacterUsecase {
  constructor(private readonly restoreCharacterRepository: IRestoreCharacterRepository,) { }

  /**
   * 登場人物復元（論理削除を解除する）
   * @param userId 書籍を所有するユーザーID
   * @param characterId 復元する登場人物ID
   * @returns 成功時は復元した登場人物の DTO。
   * 削除済みの登場人物が存在しない（削除されていない登場人物・他ユーザーの書籍の登場人物・作品または書籍が論理削除済みを含む）場合は NOT_FOUND（保存しない）
   * @throws characterId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterId }: PropsType): Promise<Result<RestoreCharacterResultDto, RestoreCharacterError>> {
    const id = CharacterId.of(characterId);

    // 削除済みの登場人物の存在・所有者チェック
    const character = await this.restoreCharacterRepository.findCharacter(userId, id);
    if (!character) {
      return err({ type: "NOT_FOUND" });
    }

    character.restore();

    await this.restoreCharacterRepository.restoreCharacter(character);

    return ok(new RestoreCharacterResultDto(character));
  }
}
