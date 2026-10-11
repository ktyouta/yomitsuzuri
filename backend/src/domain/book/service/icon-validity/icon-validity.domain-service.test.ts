import { describe, it, expect, vi } from "vitest";
import { IconId, IconValidityDomainService, type IIconValidityRepository } from "../../..";

/**
 * 指定した ID のうち validIds に含まれるものだけを有効として返すリポジトリのスタブ
 */
function createRepository(validIds: number[]) {
  return {
    findValidIds: vi.fn<IIconValidityRepository["findValidIds"]>().mockImplementation(async (iconIds) =>
      iconIds.map((e) => e.value).filter((e) => validIds.includes(e))),
  } satisfies IIconValidityRepository;
}

describe("IconValidityDomainService", () => {
  describe("isValid", () => {
    it.each([[[1], true], [[], false]])("有効なアイコンが %j の場合、%s を返すこと", async (validIds, expected) => {
      const service = new IconValidityDomainService(createRepository(validIds));

      expect(await service.isValid(IconId.of(1))).toBe(expected);
    });
  });

  describe("findInvalid", () => {
    it("指定したアイコンのうち、無効なものだけを返すこと", async () => {
      const service = new IconValidityDomainService(createRepository([1, 3]));

      const invalid = await service.findInvalid([IconId.of(1), IconId.of(2), IconId.of(3), IconId.of(4)]);

      expect(invalid.map((e) => e.value)).toEqual([2, 4]);
    });

    it("重複を除いたアイコンで、1回だけ問い合わせること", async () => {
      const repository = createRepository([1]);
      const service = new IconValidityDomainService(repository);

      await service.findInvalid([IconId.of(1), IconId.of(2), IconId.of(1)]);

      expect(repository.findValidIds).toHaveBeenCalledTimes(1);
      expect(repository.findValidIds.mock.calls[0]?.[0].map((e) => e.value)).toEqual([1, 2]);
    });

    it("無効なアイコンが同じ ID で複数指定されていても、1件として返すこと", async () => {
      const service = new IconValidityDomainService(createRepository([]));

      const invalid = await service.findInvalid([IconId.of(2), IconId.of(2)]);

      expect(invalid.map((e) => e.value)).toEqual([2]);
    });
  });
});
