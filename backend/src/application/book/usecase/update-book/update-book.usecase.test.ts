import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { UpdateBookUsecase } from "./update-book.usecase";
import { BookAggregate, BookId, BookMemo, BookTitle, BookTitleUniquenessDomainService, CurrentPage, IconId, IconValidityDomainService, PublishedDate, ReadingStatusId, ReadingStatusValidityDomainService, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IBookTitleUniquenessRepository, type IIconValidityRepository, type IReadingStatusValidityRepository, type IUpdateBookRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const DELETED_WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時 */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（更新後の書籍の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  readingStatus: 2,
  currentPage: 120,
  memo: "メモ",
  iconId: 2,
  works: [
    { id: WORK_ID_1, sort: 2 },
    { id: WORK_ID_2, sort: 1 },
  ],
  updatedAt: BOOK_UPDATED_AT,
};

/**
 * 更新前の書籍集約（削除されていない作品2件と、削除済みの作品1件を持つ）
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
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false, updatedAt: Timestamp.of(WORK_UPDATED_AT) }),
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false, updatedAt: Timestamp.of(WORK_UPDATED_AT) }),
      WorkEntity.reconstruct({ id: WorkId.of(DELETED_WORK_ID), title: WorkTitle.of("削除済み作品"), sort: WorkSort.of(null), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: true, updatedAt: Timestamp.of(WORK_UPDATED_AT) }),
    ],
    updatedAt: Timestamp.of(BOOK_UPDATED_AT),
  });
}

type Options = {
  book?: BookAggregate | null;
  invalidIconIds?: number[];
  readingStatusExists?: boolean;
  duplicatedIds?: { id: string, deleteFlg: boolean }[];
  saved?: boolean;
};

function createUsecase({ book = createBook(), invalidIconIds = [], readingStatusExists = true, duplicatedIds = [], saved = true }: Options = {}) {
  const updateBookRepository = {
    findBook: vi.fn<IUpdateBookRepository["findBook"]>().mockResolvedValue(book),
    updateBook: vi.fn<IUpdateBookRepository["updateBook"]>().mockResolvedValue(saved),
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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("書籍情報と作品の表示順を、現在日時を更新日時として保存し、削除済みを含む作品（削除フラグ付き）と更新後の更新日時を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(updateBookRepository.updateBook).toHaveBeenCalledTimes(1);
    const [savedBook, expectedUpdatedAt] = updateBookRepository.updateBook.mock.calls[0] ?? [];
    // 保存時の排他の条件には、画面の表示時点の更新日時を使う
    expect(expectedUpdatedAt?.value).toBe(BOOK_UPDATED_AT);
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
        // 作品は表示順だけを変更し、更新日時は変更しない
        { id: WORK_ID_1, title: "作品1", sort: 2, memo: null, iconId: 1, deleteFlg: false, updatedAt: WORK_UPDATED_AT },
        { id: WORK_ID_2, title: "作品2", sort: 1, memo: null, iconId: 1, deleteFlg: false, updatedAt: WORK_UPDATED_AT },
        // 削除済みの作品は送らなくても、変更せずに保持する
        { id: DELETED_WORK_ID, title: "削除済み作品", sort: null, memo: null, iconId: 1, deleteFlg: true, updatedAt: WORK_UPDATED_AT },
      ],
      updatedAt: NOW,
    });

    const dto = result._unsafeUnwrap();
    expect(dto.value.id).toBe(BOOK_ID.value);
    expect(dto.value.title).toBe("容疑者Xの献身");
    expect(dto.value.updatedAt).toBe(NOW);
    expect(dto.value.works.map((e) => ({ title: e.title, deleteFlg: e.deleteFlg }))).toEqual(expect.arrayContaining([
      { title: "作品1", deleteFlg: false },
      { title: "作品2", deleteFlg: false },
      { title: "削除済み作品", deleteFlg: true },
    ]));
    expect(dto.value.works).toHaveLength(3);
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

  it("書籍のアイコンの有効性を確認すること", async () => {
    const { usecase, iconValidityRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(iconValidityRepository.findValidIds).toHaveBeenCalledTimes(1);
    expect(iconValidityRepository.findValidIds.mock.calls[0]?.[0].map((e) => e.value)).toEqual([2]);
  });

  it("書籍のアイコンが無効な場合、INVALID_ICON を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ invalidIconIds: [2] });

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

  it("削除されていない同名の書籍が存在する場合、DUPLICATE_TITLE を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVRZ", deleteFlg: false }] });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TITLE" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("削除済みの同名の書籍だけが存在する場合、DUPLICATE_DELETED_TITLE を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVRZ", deleteFlg: true }] });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_TITLE" });
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

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_BOOK を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: { ...BODY, updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で更新されていたため保存されなかった場合、CONFLICT_BOOK を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase({ saved: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(updateBookRepository.updateBook).toHaveBeenCalledTimes(1);
  });

  it("作品の表示順が重複する場合、INVALID_WORKS で違反一覧を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: WORK_ID_1, sort: 1 }, { id: WORK_ID_2, sort: 1 }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_WORKS",
      errors: [{ type: "DUPLICATE_WORK_SORT", sort: 1 }],
    });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品の指定が既存の作品と一致しない場合、WORKS_MISMATCH を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: WORK_ID_1, sort: 1 }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品 ID の形式が不正な場合も判定せず、既存の作品と一致しないため WORKS_MISMATCH を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: WORK_ID_1, sort: 1 }, { id: "invalid", sort: 2 }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品 ID が重複している場合、INVALID_WORKS で DUPLICATE_WORK_ID を返し、保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: WORK_ID_1, sort: 1 }, { id: WORK_ID_1, sort: 2 }] },
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
          { id: WORK_ID_1, sort: 1 },
          { id: WORK_ID_2, sort: 0 },
        ],
        updatedAt: BOOK_UPDATED_AT,
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
        { field: "works.1.sort", error: { type: "WORK_SORT_INVALID", min: 1 } },
      ],
    });
    expect(updateBookRepository.findBook).not.toHaveBeenCalled();
    expect(iconValidityRepository.findValidIds).not.toHaveBeenCalled();
    expect(readingStatusValidityRepository.exists).not.toHaveBeenCalled();
    expect(uniquenessRepository.findBook).not.toHaveBeenCalled();
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("作品の表示順だけが制約を満たさない場合も、INVALID_INPUT を返すこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID.value,
      body: { ...BODY, works: [{ id: WORK_ID_1, sort: 1.5 }, { id: WORK_ID_2, sort: 2 }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "works.0.sort", error: { type: "WORK_SORT_INVALID", min: 1 } }],
    });
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時の形式が不正な場合、INVALID_INPUT を返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID.value, body: { ...BODY, updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } }],
    });
    expect(updateBookRepository.findBook).not.toHaveBeenCalled();
    expect(updateBookRepository.updateBook).not.toHaveBeenCalled();
  });
});
