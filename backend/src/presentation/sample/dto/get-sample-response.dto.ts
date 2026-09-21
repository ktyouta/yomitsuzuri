import { GetSampleEntity } from "../../../domain/sample";

/**
 * サンプルレスポンスの型
 */
export type GetSampleResponseType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル取得レスポンスDTO
 */
export class GetSampleResponseDto {
  private readonly _value: GetSampleResponseType;

  constructor(entity: GetSampleEntity) {
    this._value = {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  get value(): GetSampleResponseType {
    return this._value;
  }
}
