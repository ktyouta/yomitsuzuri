import { describe, it, expect, vi } from "vitest";
import { IconId, IconValidityDomainService, type IIconValidityRepository } from "../../..";

function createRepository(exists: boolean) {
  return {
    exists: vi.fn<IIconValidityRepository["exists"]>().mockResolvedValue(exists),
  } satisfies IIconValidityRepository;
}

describe("IconValidityDomainService", () => {
  it.each([true, false])("Repository の判定が%sの場合、そのまま返すこと", async (exists) => {
    const service = new IconValidityDomainService(createRepository(exists));

    expect(await service.isValid(new IconId(1))).toBe(exists);
  });

  it("渡したアイコンIDで Repository に問い合わせること", async () => {
    const repository = createRepository(true);
    const service = new IconValidityDomainService(repository);
    const iconId = new IconId(3);

    await service.isValid(iconId);

    expect(repository.exists).toHaveBeenCalledWith(iconId);
  });
});
