import { GetListSampleEntity } from "../../../domain/sample";

/**
 * サンプルレスポンスの型
 */
export type GetListSampleResponseType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル一覧レスポンスDTO
 */
export class GetListSampleResponseDto {
  private readonly _value: GetListSampleResponseType[];

  constructor(entities: GetListSampleEntity[]) {
    this._value = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));
  }

  get value(): GetListSampleResponseType[] {
    return this._value;
  }
}
