import type { WorkEntity } from "../../../../domain";

export type CreateWorkResultType = {
  id: string;
  title: string;
  sort: number | null;
  memo: string | null;
  iconId: number;
  deleteFlg: boolean;
  updatedAt: string;
};

/**
 * 作品追加結果 DTO
 * 永続化した作品を唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class CreateWorkResultDto {
  private readonly _value: CreateWorkResultType;

  /**
   * @param work 追加した作品
   */
  constructor(work: WorkEntity) {
    const snapshot = work.toSnapshot();

    this._value = {
      id: snapshot.id,
      title: snapshot.title,
      sort: snapshot.sort,
      memo: snapshot.memo,
      iconId: snapshot.iconId,
      deleteFlg: snapshot.deleteFlg,
      updatedAt: snapshot.updatedAt,
    };
  }

  get value(): CreateWorkResultType {
    return this._value;
  }
}
