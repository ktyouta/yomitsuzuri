import type { UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 登場人物一覧の1件分
 */
export type CharacterListItem = {
  id: string;
  name: string;
  age: string | null;
  occupation: string | null;
  updatedAt: string;
};

/**
 * 登場人物一覧取得リポジトリインターフェース
 */
export interface IGetListCharacterRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 作品の登場人物一覧を更新日時の降順で取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 登場人物が属する作品ID
   * @returns 論理削除されていない登場人物一覧（作品が取得対象外の場合は空配列）
   */
  findCharacterList(userId: UserId, workId: WorkId): Promise<CharacterListItem[]>;
}
