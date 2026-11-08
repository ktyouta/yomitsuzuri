import { err, ok, type Result } from "neverthrow";
import { CharacterId, type IGetCharacterRepository, type UserId } from "../../../../domain";
import { GetCharacterResultDto } from "../../dto";

export type GetCharacterError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  characterId: string;
}

/**
 * 登場人物詳細取得ユースケース
 */
export class GetCharacterUsecase {
  constructor(private readonly repository: IGetCharacterRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 成功時は登場人物と関係一覧の DTO（論理削除済みの登場人物も返す）、登場人物が存在しない・他ユーザーの書籍の登場人物・作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws characterId が空の場合（登場人物・関係は問い合わせない）
   */
  async execute({ userId, characterId }: PropsType): Promise<Result<GetCharacterResultDto, GetCharacterError>> {
    const id = CharacterId.of(characterId);

    const [character, relations] = await Promise.all([
      this.repository.findCharacter(userId, id),
      this.repository.findCharacterRelationList(userId, id),
    ]);

    if (!character) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetCharacterResultDto(character, relations));
  }
}
