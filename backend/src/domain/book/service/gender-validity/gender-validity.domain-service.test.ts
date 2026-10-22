import { describe, it, expect, vi } from "vitest";
import { GenderId, GenderValidityDomainService, type IGenderValidityRepository } from "../../..";

function createRepository(exists: boolean) {
  return {
    exists: vi.fn<IGenderValidityRepository["exists"]>().mockResolvedValue(exists),
  } satisfies IGenderValidityRepository;
}

describe("GenderValidityDomainService", () => {
  it.each([true, false])("Repository の判定が%sの場合、そのまま返すこと", async (exists) => {
    const service = new GenderValidityDomainService(createRepository(exists));

    expect(await service.isValid(GenderId.of(1))).toBe(exists);
  });

  it("渡した性別IDで Repository に問い合わせること", async () => {
    const repository = createRepository(true);
    const service = new GenderValidityDomainService(repository);
    const genderId = GenderId.of(2);

    await service.isValid(genderId);

    expect(repository.exists).toHaveBeenCalledWith(genderId);
  });

  it("性別が未入力の場合、Repository に問い合わせず true を返すこと", async () => {
    const repository = createRepository(false);
    const service = new GenderValidityDomainService(repository);

    expect(await service.isValid(GenderId.of(null))).toBe(true);
    expect(repository.exists).not.toHaveBeenCalled();
  });
});
