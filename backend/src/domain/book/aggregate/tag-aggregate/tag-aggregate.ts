import { err, ok, type Result } from "neverthrow";
import { TagEntity, type TagSnapshotType } from "../../entity";
import { type TagName } from "../../value-object";

type AddTagItemType = {
    id: string | null;
    name: TagName;
};

type AddTagParamType = {
    tags: AddTagItemType[];
};

type AddTagResultType = {
    created: TagEntity[];
    tags: TagEntity[];
};

/**
 * タグの追加の失敗
 * - INVALID_TAG_ID: 指定した ID のタグが存在しない
 * - DUPLICATE_TAG_NAME: 新規のタグの名前が、既存のタグまたは他の新規のタグと重複する
 */
export type TagAddError =
    | { type: "INVALID_TAG_ID" }
    | { type: "DUPLICATE_TAG_NAME"; names: string[] };

/**
 * ユーザーのタグの一覧
 */
export class TagAggregate {

    private constructor(private _value: TagEntity[]) { }

    /**
     * 永続化済みの値からタグの一覧を復元する
     * @param tags ユーザーのタグ
     * @returns 引数のタグをそのまま保持するタグの一覧
     */
    static reconstruct(tags: TagEntity[]) {
        return new TagAggregate(tags);
    }

    /**
     * タグを追加する
     *
     * 事前条件（満たさない場合は err）:
     * - ID を持つタグは、すべて保持するタグに存在すること
     * - ID を持たないタグの名前は、保持するタグとも、ID を持たない他のタグとも重複しないこと
     *
     * 事後条件:
     * - ID を持たないタグを、新しい ID を採番して保持するタグに加える
     * - ID を持つタグは、保持するタグをそのまま返す（引数の名前は使わない）
     * - err の場合は、保持するタグを変更しない
     * @param params.tags 追加するタグ（ID を持つものは既存のタグ、持たないものは新規のタグ）
     * @returns 成功時は新規に作成したタグ（created）と、引数の順に並べた指定のタグ（tags。新規のタグは created と同じもの）、事前条件を満たさない場合はその内容を持つ Result
     * @throws 存在を確認した既存のタグが見つからない場合（自分たちの不具合）
     */
    add(params: AddTagParamType): Result<AddTagResultType, TagAddError> {
        const { tags } = params;
        const tagById = new Map(this._value.map((tag) => [tag.id.value, tag]));
        const tagNames = new Set(this._value.map((tag) => tag.name.value));
        const existTagIds: string[] = [];
        const newTagNames: TagName[] = [];

        for (const tag of tags) {
            if (!tag.id) {
                newTagNames.push(tag.name);
            } else {
                existTagIds.push(tag.id);
            }
        }

        // IDの存在チェック
        if (existTagIds.some((id) => !tagById.has(id))) {
            return err({ type: "INVALID_TAG_ID" });
        }

        // タグ名重複チェック（既存のタグとの重複と、新規のタグ同士の重複）
        const seenNames = new Set<string>();
        const duplicateNames = new Set<string>();
        for (const name of newTagNames) {
            if (tagNames.has(name.value) || seenNames.has(name.value)) {
                duplicateNames.add(name.value);
            }
            seenNames.add(name.value);
        }

        if (duplicateNames.size > 0) {
            return err({ type: "DUPLICATE_TAG_NAME", names: [...duplicateNames] });
        }

        const created: TagEntity[] = [];
        const resolved: TagEntity[] = [];

        for (const tag of tags) {
            const id = tag.id;
            let tagEntity: TagEntity;
            if (!id) {
                tagEntity = TagEntity.create({ name: tag.name });
                created.push(tagEntity);
            } else {
                const existsTag = tagById.get(id);
                if (!existsTag) {
                    throw new Error(`存在確認済みのタグが見つかりません。tagId:${id}`);
                }
                tagEntity = existsTag;
            }
            resolved.push(tagEntity);
        }

        this._value = [...this._value, ...created];
        return ok({ created, tags: resolved });
    }

    /**
     * スナップショットを作成
     * @returns 保持するタグの値
     */
    toSnapshot(): TagSnapshotType[] {
        return this._value.map((value) => value.toSnapshot());
    }
}
