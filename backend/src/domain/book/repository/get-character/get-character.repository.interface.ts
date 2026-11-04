import type { UserId } from "../../../shared";
import type { CharacterId } from "../../value-object";

/**
 * 登場人物詳細
 */
export type CharacterDetail = {
  id: string;
  workId: string;
  name: string;
  age: string | null;
  genderId: number | null;
  genderLabel: string | null;
  occupation: string | null;
  characteristic: string | null;
  memo: string | null;
  updatedAt: string;
  deleteFlg: boolean;
};

/**
 * 登場人物詳細に表示する登場人物関係の1件分
 */
export type CharacterDetailRelationItem = {
  id: string;
  characterId: string;
  characterName: string;
  targetCharacterId: string;
  targetCharacterName: string;
  relationName: string;
};

/**
 * 登場人物詳細取得リポジトリインターフェース
 */
export interface IGetCharacterRepository {
  /**
   * ユーザーの登場人物を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 論理削除済みを含む登場人物（存在しない・他ユーザーの書籍の登場人物・作品または書籍が論理削除済みの場合は null）
   */
  findCharacter(userId: UserId, characterId: CharacterId): Promise<CharacterDetail | null>;

  /**
   * 登場人物が人物または相手である関係の一覧を ID の昇順で取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 関係と両方の登場人物が論理削除されていない関係の一覧（登場人物が取得対象外の場合は空配列）
   */
  findCharacterRelationList(userId: UserId, characterId: CharacterId): Promise<CharacterDetailRelationItem[]>;
}
