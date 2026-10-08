import { describe, it, expect, vi } from "vitest";
import { CreateBookUsecase } from "..";
import { BookTitleUniquenessDomainService, IconValidityDomainService, type IBookTitleUniquenessRepository, type ICreateBookRepository, type IIconValidityRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  currentPage: 120,
  memo: "メモ",
  icon: 2,
};

type Options = {
  iconExists?: boolean;
  duplicatedIds?: { id: string }[];
};

function createUsecase({ iconExists = true, duplicatedIds = [] }: Options = {}) {
  const createBookRepository = {
    createBook: vi.fn<ICreateBookRepository["createBook"]>().mockResolvedValue(),
  } satisfies ICreateBookRepository;
  const uniquenessRepository = {
    findBook: vi.fn<IBookTitleUniquenessRepository["findBook"]>().mockResolvedValue(duplicatedIds),
  } satisfies IBookTitleUniquenessRepository;
  const iconValidityRepository = {
    exists: vi.fn<IIconValidityRepository["exists"]>().mockResolvedValue(iconExists),
  } satisfies IIconValidityRepository;

  const usecase = new CreateBookUsecase(
    createBookRepository,
    new BookTitleUniquenessDomainService(uniquenessRepository),
    new IconValidityDomainService(iconValidityRepository),
  );

  return { usecase, createBookRepository, uniquenessRepository };
}

describe("CreateBookUsecase", () => {
  it("書籍と、書籍タイトルと同名の作品1件を保存し、その内容を返すこと", async () => {
    const { usecase, createBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, body: BODY });

    expect(createBookRepository.createBook).toHaveBeenCalledTimes(1);
    const savedBook = createBookRepository.createBook.mock.calls[0]?.[0];
    expect(savedBook?.toSnapshot()).toEqual({
      id: expect.stringMatching(ULID_PATTERN),
      userId: USER_ID.value,
      title: "容疑者Xの献身",
      publishedDate: "2005-08",
      readingStatusId: 1,
      currentPage: 120,
      memo: "メモ",
      iconId: 2,
      deleteFlg: false,
      works: [
        {
          id: expect.stringMatching(ULID_PATTERN),
          title: "容疑者Xの献身",
          sort: 1,
          memo: null,
          deleteFlg: false,
        },
      ],
    });

    expect(result.isOk()).toBe(true);
    const dto = result._unsafeUnwrap();
    expect(dto.value.id).toBe(savedBook?.id.value);
    expect(dto.value.title).toBe("容疑者Xの献身");
    expect(dto.value.works).toHaveLength(1);
    expect(dto.value.works[0]?.title).toBe("容疑者Xの献身");
  });

  it("出版日・現在のページ数・メモが未指定の場合、null で保存されること", async () => {
    const { usecase, createBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, body: { title: "容疑者Xの献身", icon: 1 } });

    const snapshot = createBookRepository.createBook.mock.calls[0]?.[0].toSnapshot();
    expect(snapshot?.publishedDate).toBeNull();
    expect(snapshot?.currentPage).toBeNull();
    expect(snapshot?.memo).toBeNull();
  });

  it("アイコンが無効な場合、INVALID_ICON を返し、保存しないこと", async () => {
    const { usecase, createBookRepository } = createUsecase({ iconExists: false });

    const result = await usecase.execute({ userId: USER_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_ICON" });
    expect(createBookRepository.createBook).not.toHaveBeenCalled();
  });

  it("同名の書籍が存在する場合、DUPLICATE_TITLE を返し、保存しないこと", async () => {
    const { usecase, createBookRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVRZ" }] });

    const result = await usecase.execute({ userId: USER_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TITLE" });
    expect(createBookRepository.createBook).not.toHaveBeenCalled();
  });

  it("指定したユーザー・タイトルで同名書籍を問い合わせること", async () => {
    const { usecase, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, body: { ...BODY, title: "  容疑者Xの献身  " } });

    const [userId, , bookTitle] = uniquenessRepository.findBook.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(bookTitle?.value).toBe("容疑者Xの献身");
  });

  it("タイトルが空白のみの場合、例外になり、保存しないこと", async () => {
    const { usecase, createBookRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, body: { ...BODY, title: "   " } })).rejects.toThrow("書籍タイトルが設定されていません。");
    expect(createBookRepository.createBook).not.toHaveBeenCalled();
  });
});
