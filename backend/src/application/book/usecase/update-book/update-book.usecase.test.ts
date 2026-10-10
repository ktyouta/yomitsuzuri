import { describe, it, expect, vi } from "vitest";
import { UpdateBookUsecase } from "./update-book.usecase";
import { BookAggregate, BookId, BookMemo, BookTitle, BookTitleUniquenessDomainService, CurrentPage, IconId, IconValidityDomainService, PublishedDate, ReadingStatusId, ReadingStatusValidityDomainService, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IBookTitleUniquenessRepository, type IIconValidityRepository, type IReadingStatusValidityRepository, type IUpdateBookRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  readingStatus: 2,
  currentPage: 120,
  memo: "メモ",
  iconId: 2,
  works: [
    { id: WORK_ID_1, title: "作品1改", sort: 2, memo: "作品メモ", deleteFlg: false },
    { id: WORK_ID_2, title: "作品2", sort: 1, memo: "", deleteFlg: true },
    { id: null, title: "作品3", sort: 1, memo: "", deleteFlg: false },
  ],
};

/**
 * 更新前の書籍集約（作品2件を持つ）
 */
function createBook(): BookAggregate {
  return BookAggregate.reconstruct({
    id: BOOK_ID,
    userId: USER_ID,
    title: new BookTitle("更新前タイトル"),
    publishedDate: new PublishedDate(null),
    readingStatusId: ReadingStatusId.initial(),
    currentPage: new CurrentPage(null),
    memo: new BookMemo(null),
    iconId: new IconId(1),
    deleteFlg: false,
    works: [
      new WorkEntity(WorkId.of(WORK_ID_1), new WorkTitle("作品1"), WorkSort.of(1), new WorkMemo(null), false),
      new WorkEntity(WorkId.of(WORK_ID_2), new WorkTitle("作品2"), WorkSort.of(2), new WorkMemo(null), false),
    ],
  });
}

type Options = {
  book?: BookAggregate | null;
  iconExists?: boolean;
  readingStatusExists?: boolean;
  duplicatedIds?: { id: string }[];
};

function createUsecase({ book = createBook(), iconExists = true, readingStatusExists = true, duplicatedIds = [] }: Options = {}) {
  const updateBookRepository = {
    findBook: vi.fn<IUpdateBookRepository["findBook"]>().mockResolvedValue(book),
    updateBook: vi.fn<IUpdateBookRepository["updateBook"]>().mockResolvedValue(),
  } satisfies IUpdateBookRepository;
  const uniquenessRepository = {
    findBook: vi.fn<IBookTitleUniquenessRepository["findBook"]>().mockResolvedValue(duplicatedIds),
  } satisfies IBookTitleUniquenessRepository;
  const iconValidityRepository = {
    exists: vi.fn<IIconValidityRepository["exists"]>().mockResolvedValue(iconExists),
  } satisfies IIconValidityRepository;
  const readingStatusValidityRepository = {
    exists: vi.fn<IReadingStatusValidityRepository["exists"]>().mockResolvedValue(readingStatusExists),
  } satisfies IReadingStatusValidityRepository;

  const usecase = new UpdateBookUsecase(
    updateBookRepository,
    new BookTitleUniquenessDomainService(uniquenessRepository),
    new IconValidityDomainService(iconValidityRepository),
    new ReadingStatusValidityDomainService(readingStatusValidityRepository),
  );

  return { usecase, updateBookRepository, uniquenessRepository };
}

describe("UpdateBookUsecase", () => {
  it("書籍と作品を更新内容で保存し、削除されていない作品だけを含む内容を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(updateBookRepository.updateBook).toHaveBeenCalledTimes(1);
    const savedBook = updateBookRepository.updateBook.mock.calls[0]?.[0];
    expect(savedBook?.toSnapshot()).toEqual({
      id: BOOK_ID.value,
      userId: USER_ID.value,
      title: "容疑者Xの献身",
      publishedDate: "2005-08",
      readingStatusId: 2,
      currentPage: 120,
      memo: "メモ",
      iconId: 2,
      deleteFlg: false,
      works: [
        { id: WORK_ID_1, title: "作品1改", sort: 2, memo: "作品メモ", deleteFlg: false },
        { id: WORK_ID_2, title: "作品2", sort: 1, memo: null, deleteFlg: true },
        { id: expect.stringMatching(ULID_PATTERN), title: "作品3", sort: 1, memo: null, deleteFlg: false },
      ],
    });

    const dto = result._unsafeUnwrap();
    expect(dto.value.id).toBe(BOOK_ID.value);
    expect(dto.value.title).toBe("容疑者Xの献身");
    expect(dto.value.works.map((e) => e.title)).toEqual(["作品1改", "作品3"]);
  });

  it("指定したユーザー・書籍IDで更新対象を取得すること", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(updateBookRepository.findBook).toHaveBeenCalledWith(USER_ID, BOOK_ID);
  });

  it("更新対象の書籍が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("アイコンが無効な場合、INVALID_ICON を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ iconExists: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_ICON" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("読書状況が無効な場合、INVALID_READING_STATUS を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ readingStatusExists: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_READING_STATUS" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("同名の書籍が存在する場合、DUPLICATE_TITLE を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVRZ" }] });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TITLE" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("更新対象の書籍自身を除外し、更新後のタイトルで同名書籍を問い合わせること", async () => {
    const { usecase, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { ...BODY, title: "  容疑者Xの献身  " } });

    const [userId, bookId, bookTitle] = uniquenessRepository.findBook.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(bookId).toBe(BOOK_ID);
    expect(bookTitle?.value).toBe("容疑者Xの献身");
  });

  it("作品が不変条件に違反する場合、INVALID_WORKS で違反一覧を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID,
      body: {
        ...BODY,
        works: [
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: "", deleteFlg: false },
          { id: WORK_ID_2, title: "作品1", sort: 2, memo: "", deleteFlg: false },
        ],
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_WORKS",
      errors: [{ type: "DUPLICATE_WORK_TITLE", title: "作品1" }],
    });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("既存の作品が含まれていない場合、例外になり、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    await expect(usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID,
      body: { ...BODY, works: [{ id: WORK_ID_1, title: "作品1", sort: 1, memo: "", deleteFlg: false }] },
    })).rejects.toThrow("作品の指定が既存の作品と一致しません。");
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("タイトルが空白のみの場合、例外になり、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { ...BODY, title: "   " } })).rejects.toThrow("書籍タイトルが設定されていません。");
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });
});
