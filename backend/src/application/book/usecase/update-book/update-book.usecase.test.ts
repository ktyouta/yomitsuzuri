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
    { id: WORK_ID_1, title: "作品1改", sort: 2, memo: "作品メモ", iconId: 4, deleteFlg: false },
    { id: WORK_ID_2, title: "作品2", sort: 1, memo: "", iconId: 1, deleteFlg: true },
    { id: null, title: "作品3", sort: 1, memo: "", iconId: 5, deleteFlg: false },
  ],
};

/**
 * 更新前の書籍集約（作品2件を持つ）
 */
function createBook(): BookAggregate {
  return BookAggregate.reconstruct({
    id: BOOK_ID,
    userId: USER_ID,
    title: BookTitle.of("更新前タイトル"),
    publishedDate: PublishedDate.of(null),
    readingStatusId: ReadingStatusId.initial(),
    currentPage: CurrentPage.of(null),
    memo: BookMemo.of(null),
    iconId: IconId.of(1),
    deleteFlg: false,
    works: [
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
    ],
  });
}

type Options = {
  book?: BookAggregate | null;
  invalidIconIds?: number[];
  readingStatusExists?: boolean;
  duplicatedIds?: { id: string }[];
};

function createUsecase({ book = createBook(), invalidIconIds = [], readingStatusExists = true, duplicatedIds = [] }: Options = {}) {
  const updateBookRepository = {
    findBook: vi.fn<IUpdateBookRepository["findBook"]>().mockResolvedValue(book),
    updateBook: vi.fn<IUpdateBookRepository["updateBook"]>().mockResolvedValue(),
  } satisfies IUpdateBookRepository;
  const uniquenessRepository = {
    findBook: vi.fn<IBookTitleUniquenessRepository["findBook"]>().mockResolvedValue(duplicatedIds),
  } satisfies IBookTitleUniquenessRepository;
  const iconValidityRepository = {
    findValidIds: vi.fn<IIconValidityRepository["findValidIds"]>().mockImplementation(async (iconIds) =>
      iconIds.map((e) => e.value).filter((e) => !invalidIconIds.includes(e))),
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

  return { usecase, updateBookRepository, uniquenessRepository, iconValidityRepository, readingStatusValidityRepository };
}

describe("UpdateBookUsecase", () => {
  it("書籍と作品を更新内容で保存し、削除されていない作品だけを含む内容を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

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
        { id: WORK_ID_1, title: "作品1改", sort: 2, memo: "作品メモ", iconId: 4, deleteFlg: false },
        { id: WORK_ID_2, title: "作品2", sort: 1, memo: null, iconId: 1, deleteFlg: true },
        { id: expect.stringMatching(ULID_PATTERN), title: "作品3", sort: 1, memo: null, iconId: 5, deleteFlg: false },
      ],
    });

    const dto = result._unsafeUnwrap();
    expect(dto.value.id).toBe(BOOK_ID.value);
    expect(dto.value.title).toBe("容疑者Xの献身");
    expect(dto.value.works.map((e) => e.title)).toEqual(["作品1改", "作品3"]);
  });

  it("指定したユーザー・書籍IDで更新対象を取得すること", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(updateBookRepository.findBook).toHaveBeenCalledWith(USER_ID, BOOK_ID);
  });

  it("更新対象の書籍が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("書籍と作品のアイコンの有効性を1回の問い合わせでまとめて確認すること（重複は除く）", async () => {
    const { usecase, iconValidityRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(iconValidityRepository.findValidIds).toHaveBeenCalledTimes(1);
    expect(iconValidityRepository.findValidIds.mock.calls[0]?.[0].map((e) => e.value)).toEqual([2, 4, 1, 5]);
  });

  it("書籍・作品のいずれかのアイコンが無効な場合、INVALID_ICON を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ invalidIconIds: [2, 5] });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_ICON" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("読書状況が無効な場合、INVALID_READING_STATUS を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ readingStatusExists: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_READING_STATUS" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("同名の書籍が存在する場合、DUPLICATE_TITLE を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVRZ" }] });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TITLE" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("更新対象の書籍自身を除外し、更新後のタイトルで同名書籍を問い合わせること", async () => {
    const { usecase, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: { ...BODY, title: "  容疑者Xの献身  " } });

    const [userId, bookId, bookTitle] = uniquenessRepository.findBook.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(bookId?.value).toBe(BOOK_ID.value);
    expect(bookTitle?.value).toBe("容疑者Xの献身");
  });

  it("作品が不変条件に違反する場合、INVALID_WORKS で違反一覧を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: {
        ...BODY,
        works: [
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: "", iconId: 1, deleteFlg: false },
          { id: WORK_ID_2, title: "作品1", sort: 2, memo: "", iconId: 1, deleteFlg: false },
        ],
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_WORKS",
      errors: [{ type: "DUPLICATE_WORK_TITLE", title: "作品1" }],
    });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品の指定が既存の作品と一致しない場合、WORKS_MISMATCH を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: WORK_ID_1, title: "作品1", sort: 1, memo: "", iconId: 1, deleteFlg: false }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品 ID の形式が不正な場合も判定せず、既存の作品と一致しないため WORKS_MISMATCH を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: {
        ...BODY,
        works: [
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: "", iconId: 1, deleteFlg: false },
          { id: "invalid", title: "作品2", sort: 2, memo: "", iconId: 1, deleteFlg: false },
        ],
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品 ID が重複している場合、INVALID_WORKS で DUPLICATE_WORK_ID を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: {
        ...BODY,
        works: [
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: "", iconId: 1, deleteFlg: false },
          { id: WORK_ID_1, title: "作品2", sort: 2, memo: "", iconId: 1, deleteFlg: false },
        ],
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_WORKS", errors: [{ type: "DUPLICATE_WORK_ID", id: WORK_ID_1 }] });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で書籍・作品の違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateBookRepository, uniquenessRepository, iconValidityRepository, readingStatusValidityRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: {
        title: "   ",
        publishedDate: "2024-04-31",
        readingStatus: 0,
        currentPage: -1,
        memo: "あ".repeat(2001),
        iconId: 0,
        works: [
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: "", iconId: 1, deleteFlg: false },
          { id: "invalid", title: "", sort: 0, memo: "あ".repeat(2001), iconId: 0, deleteFlg: false },
        ],
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "title", error: { type: "BOOK_TITLE_EMPTY" } },
        { field: "publishedDate", error: { type: "PUBLISHED_DATE_NOT_EXIST" } },
        { field: "readingStatus", error: { type: "READING_STATUS_ID_INVALID" } },
        { field: "currentPage", error: { type: "CURRENT_PAGE_INVALID", min: 0 } },
        { field: "memo", error: { type: "BOOK_MEMO_TOO_LONG", max: 2000 } },
        { field: "iconId", error: { type: "ICON_ID_INVALID" } },
        { field: "works.1.title", error: { type: "WORK_TITLE_EMPTY" } },
        { field: "works.1.sort", error: { type: "WORK_SORT_INVALID", min: 1 } },
        { field: "works.1.memo", error: { type: "WORK_MEMO_TOO_LONG", max: 2000 } },
        { field: "works.1.iconId", error: { type: "ICON_ID_INVALID" } },
      ],
    });
    expect(updateBookRepository.findBook).not.toHaveBeenCalled();
    expect(iconValidityRepository.findValidIds).not.toHaveBeenCalled();
    expect(readingStatusValidityRepository.exists).not.toHaveBeenCalled();
    expect(uniquenessRepository.findBook).not.toHaveBeenCalled();
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品の項目だけが制約を満たさない場合も、INVALID_INPUT を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: null, title: "あ".repeat(101), sort: 1, iconId: 1, deleteFlg: false }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "works.0.title", error: { type: "WORK_TITLE_TOO_LONG", max: 100 } }],
    });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });
});
