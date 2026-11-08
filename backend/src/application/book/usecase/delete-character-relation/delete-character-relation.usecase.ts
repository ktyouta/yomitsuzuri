import { err, ok, Result } from "neverthrow";
import { CharacterRelationId, type IDeleteCharacterRelationRepository, type UserId } from "../../../../domain";

export type DeleteCharacterRelationError =
  | { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  characterRelationId: string;
}

/**
 * 登場人物関係削除ユースケース
 */
export class DeleteCharacterRelationUsecase {
  constructor(private readonly deleteCharacterRelationRepository: IDeleteCharacterRelationRepository,
  ) { }

  /**
   * 登場人物関係削除（論理削除する。人物・相手の削除状態は問わない）
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 削除する登場人物関係ID
   * @returns 成功時は ok。
   * 登場人物関係が存在しない（他ユーザーの書籍の登場人物関係・登場人物関係、作品または書籍が論理削除済みを含む）場合はエラー（何も保存しない）
   * @throws characterRelationId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterRelationId }: PropsType): Promise<Result<undefined, DeleteCharacterRelationError>> {
    const id = CharacterRelationId.of(characterRelationId);

    const characterRelation = await this.deleteCharacterRelationRepository.findCharacterRelation(userId, id);
    if (!characterRelation) {
      return err({ type: "NOT_FOUND" });
    }

    characterRelation.delete();

    await this.deleteCharacterRelationRepository.deleteCharacterRelation(characterRelation);

    return ok(undefined);
  }
}
