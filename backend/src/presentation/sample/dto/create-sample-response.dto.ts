import { CreateSampleEntity } from "../../../domain/sample";

/**
 * サンプルレスポンスの型
 */
export type CreateSampleResponseType = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * サンプル作成レスポンスDTO
 */
export class CreateSampleResponseDto {
  private readonly _value: CreateSampleResponseType;

  constructor(entity: CreateSampleEntity) {
    this._value = {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  get value(): CreateSampleResponseType {
    return this._value;
  }
}
