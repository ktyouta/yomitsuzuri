import { describe, it, expect } from "vitest";
import { TagEntity } from "..";
import { TagId, TagName } from "../../value-object";

const TAG_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("TagEntity", () => {
  describe("create", () => {
    it("ID を採番し、渡した値を持つこと", () => {
      const tag = TagEntity.create({
        name: TagName.of("ミステリー"),
      });

      expect(tag.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        name: "ミステリー",
      });
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま持つこと", () => {
      const tag = TagEntity.reconstruct({
        id: TagId.of(TAG_ID),
        name: TagName.of("ミステリー"),
      });

      expect(tag.toSnapshot()).toEqual({
        id: TAG_ID,
        name: "ミステリー",
      });
    });
  });
});
