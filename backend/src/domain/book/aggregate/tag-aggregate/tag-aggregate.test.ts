import { describe, it, expect } from "vitest";
import { TagAggregate } from "..";
import { TagEntity } from "../../entity";
import { TagId, TagName } from "../../value-object";

const TAG_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const TAG_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const UNKNOWN_TAG_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function createTag(id: string, name: string) {
  return TagEntity.reconstruct({
    id: TagId.of(id),
    name: TagName.of(name),
  });
}

function createAggregate() {
  return TagAggregate.reconstruct([
    createTag(TAG_ID_1, "ミステリー"),
    createTag(TAG_ID_2, "短編集"),
  ]);
}

describe("TagAggregate", () => {
  describe("reconstruct", () => {
    it("渡したタグをそのまま保持すること", () => {
      const aggregate = createAggregate();

      expect(aggregate.toSnapshot()).toEqual([
        { id: TAG_ID_1, name: "ミステリー" },
        { id: TAG_ID_2, name: "短編集" },
      ]);
    });
  });

  describe("add", () => {
    it("ID を持たないタグを新規に作成して保持し、作成したタグを created で返すこと", () => {
      const aggregate = createAggregate();

      const result = aggregate.add({ tags: [
        { id: TAG_ID_1, name: TagName.of("ミステリー") },
        { id: null, name: TagName.of("本格") },
      ] });

      const created = result._unsafeUnwrap().created.map((tag) => tag.toSnapshot());
      expect(created).toEqual([
        { id: expect.stringMatching(ULID_PATTERN), name: "本格" },
      ]);
      expect(aggregate.toSnapshot()).toEqual([
        { id: TAG_ID_1, name: "ミステリー" },
        { id: TAG_ID_2, name: "短編集" },
        ...created,
      ]);
    });

    it("指定したタグを引数の順に tags で返し、新規のタグは created と同じものであること", () => {
      const aggregate = createAggregate();

      const result = aggregate.add({ tags: [
        { id: null, name: TagName.of("本格") },
        { id: TAG_ID_2, name: TagName.of("短編集") },
      ] });

      const { created, tags } = result._unsafeUnwrap();
      expect(tags.map((tag) => tag.toSnapshot())).toEqual([
        created[0].toSnapshot(),
        { id: TAG_ID_2, name: "短編集" },
      ]);
    });

    it("既存のタグは、引数の名前ではなく保持しているタグの名前で返すこと", () => {
      const aggregate = createAggregate();

      const result = aggregate.add({ tags: [{ id: TAG_ID_1, name: TagName.of("別の名前") }] });

      expect(result._unsafeUnwrap().tags.map((tag) => tag.toSnapshot())).toEqual([
        { id: TAG_ID_1, name: "ミステリー" },
      ]);
    });

    it("既存のタグだけを指定した場合は、何も作成しないこと", () => {
      const aggregate = createAggregate();
      const before = aggregate.toSnapshot();

      const result = aggregate.add({ tags: [{ id: TAG_ID_2, name: TagName.of("短編集") }] });

      expect(result._unsafeUnwrap().created).toEqual([]);
      expect(aggregate.toSnapshot()).toEqual(before);
    });

    it("存在しない ID を指定した場合は INVALID_TAG_ID を返し、保持するタグを変更しないこと", () => {
      const aggregate = createAggregate();
      const before = aggregate.toSnapshot();

      const result = aggregate.add({ tags: [
        { id: UNKNOWN_TAG_ID, name: TagName.of("ミステリー") },
        { id: null, name: TagName.of("本格") },
      ] });

      expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_TAG_ID" });
      expect(aggregate.toSnapshot()).toEqual(before);
    });

    it("新規のタグの名前が既存のタグと重複する場合は DUPLICATE_TAG_NAME を返し、保持するタグを変更しないこと", () => {
      const aggregate = createAggregate();
      const before = aggregate.toSnapshot();

      const result = aggregate.add({ tags: [{ id: null, name: TagName.of("ミステリー") }] });

      expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TAG_NAME", names: ["ミステリー"] });
      expect(aggregate.toSnapshot()).toEqual(before);
    });

    it("新規のタグ同士で名前が重複する場合は DUPLICATE_TAG_NAME を返し、保持するタグを変更しないこと", () => {
      const aggregate = createAggregate();
      const before = aggregate.toSnapshot();

      const result = aggregate.add({ tags: [
        { id: null, name: TagName.of("本格") },
        { id: null, name: TagName.of("本格") },
      ] });

      expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TAG_NAME", names: ["本格"] });
      expect(aggregate.toSnapshot()).toEqual(before);
    });
  });
});
