import { describe, it, expect } from "vitest";
import { AuthorEntity } from "..";
import { AuthorId, AuthorName, AuthorSortOrder } from "../../value-object";

const AUTHOR_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function createAuthor(deleteFlg = false) {
  return AuthorEntity.reconstruct({
    id: AuthorId.of(AUTHOR_ID),
    name: AuthorName.of("東野圭吾"),
    sortOrder: AuthorSortOrder.of(1),
    deleteFlg,
  });
}

describe("AuthorEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値と削除されていない状態を持つこと", () => {
      const author = AuthorEntity.create({
        name: AuthorName.of("東野圭吾"),
        sortOrder: AuthorSortOrder.of(1),
      });

      expect(author.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        name: "東野圭吾",
        sortOrder: 1,
        deleteFlg: false,
      });
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま持つこと", () => {
      const author = createAuthor(true);

      expect(author.toSnapshot()).toEqual({
        id: AUTHOR_ID,
        name: "東野圭吾",
        sortOrder: 1,
        deleteFlg: true,
      });
    });
  });

  describe("delete", () => {
    it("自身を削除済みにすること", () => {
      const author = createAuthor();
      const before = author.toSnapshot();

      author.delete();

      expect(author.toSnapshot()).toEqual({ ...before, deleteFlg: true });
    });

    it("既に削除済みの場合は throw すること", () => {
      const author = createAuthor(true);

      expect(() => author.delete()).toThrow();
    });
  });

  describe("restore", () => {
    it("自身の削除済みを解除すること", () => {
      const author = createAuthor(true);
      const before = author.toSnapshot();

      author.restore();

      expect(author.toSnapshot()).toEqual({ ...before, deleteFlg: false });
    });

    it("削除されていない場合は throw すること", () => {
      const author = createAuthor();

      expect(() => author.restore()).toThrow();
    });
  });
});
