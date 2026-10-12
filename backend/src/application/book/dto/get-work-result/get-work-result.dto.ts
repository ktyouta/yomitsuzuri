import type { WorkType } from "../../../../domain";

export type GetWorkResultType = {
  id: string;
  title: string;
  memo: string | null;
  iconId: number;
  icon: string | null;
  updatedAt: string;
};

/**
 * 作品詳細取得結果 DTO
 */
export class GetWorkResultDto {
  private readonly _value: GetWorkResultType;

  /**
   * @param work 作品情報
   */
  constructor(work: WorkType) {
    this._value = {
      id: work.id,
      title: work.title,
      memo: work.memo,
      iconId: work.iconId,
      icon: work.icon,
      updatedAt: work.updatedAt,
    };
  }

  get value(): GetWorkResultType {
    return this._value;
  }
}
