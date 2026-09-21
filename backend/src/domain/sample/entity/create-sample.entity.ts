/**
 * サンプルエンティティ
 */
export class CreateSampleEntity {
  private readonly _id: number;
  private readonly _name: string;
  private readonly _description: string | null;
  private readonly _createdAt: string;
  private readonly _updatedAt: string;

  constructor(
    id: number,
    name: string,
    description: string | null,
    createdAt: string,
    updatedAt: string
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  /**
   * DBレコードからエンティティを生成
   */
  static fromRecord(record: {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }): CreateSampleEntity {
    return new CreateSampleEntity(
      record.id,
      record.name,
      record.description,
      record.createdAt,
      record.updatedAt
    );
  }
}
