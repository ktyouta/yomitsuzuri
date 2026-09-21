import { UpdateSampleEntity } from "../../../domain/sample";

/**
 * サンプルレスポンスの型
 */
export type UpdateSampleResponseType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル更新レスポンスDTO
 */
export class UpdateSampleResponseDto {
  private readonly _value: UpdateSampleResponseType;

  constructor(entity: UpdateSampleEntity) {
    this._value = {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  get value(): UpdateSampleResponseType {
    return this._value;
  }
}
