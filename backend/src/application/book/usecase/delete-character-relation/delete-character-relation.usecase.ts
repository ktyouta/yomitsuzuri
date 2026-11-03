import { err, ok, Result } from "neverthrow";
import type { IDeleteCharacterRelationRepository } from "../../../../domain/book";
import { CharacterRelationId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";

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
   * 登場人物関係削除（物理削除する）
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 削除する登場人物関係ID
   * @returns 成功時は ok。
   * 登場人物関係が存在しない（他ユーザーの書籍の登場人物関係・登場人物関係、作品または書籍が論理削除済みを含む）場合はエラー（何も削除しない）
   * @throws characterRelationId が空の場合（DB は問い合わせない）
   */
  async execute({ userId, characterRelationId }: PropsType): Promise<Result<undefined, DeleteCharacterRelationError>> {
    const id = CharacterRelationId.of(characterRelationId);

    const deleted = await this.deleteCharacterRelationRepository.deleteCharacterRelation(userId, id);
    if (!deleted) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
