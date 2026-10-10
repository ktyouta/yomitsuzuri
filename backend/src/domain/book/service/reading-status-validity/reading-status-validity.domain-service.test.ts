import { describe, it, expect, vi } from "vitest";
import { ReadingStatusId, ReadingStatusValidityDomainService, type IReadingStatusValidityRepository } from "../../..";

function createRepository(exists: boolean) {
  return {
    exists: vi.fn<IReadingStatusValidityRepository["exists"]>().mockResolvedValue(exists),
  } satisfies IReadingStatusValidityRepository;
}

describe("ReadingStatusValidityDomainService", () => {
  it.each([true, false])("Repository の判定が%sの場合、そのまま返すこと", async (exists) => {
    const service = new ReadingStatusValidityDomainService(createRepository(exists));

    expect(await service.isValid(ReadingStatusId.of(1))).toBe(exists);
  });

  it("渡した読書状況IDで Repository に問い合わせること", async () => {
    const repository = createRepository(true);
    const service = new ReadingStatusValidityDomainService(repository);
    const readingStatusId = ReadingStatusId.of(3);

    await service.isValid(readingStatusId);

    expect(repository.exists).toHaveBeenCalledWith(readingStatusId);
  });
});
