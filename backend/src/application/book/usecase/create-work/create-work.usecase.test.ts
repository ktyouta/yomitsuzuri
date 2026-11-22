import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, IconValidityDomainService, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type ICreateWorkRepository, type IIconValidityRepository } from "../../../../domain";
import { CreateWorkUsecase } from "./create-work.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const DELETED_WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時 */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（追加した作品の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  title: "作品3",
  memo: "作品メモ",
  iconId: 4,
};

/**
 * 追加前の書籍集約（削除されていない作品2件と、削除済みの作品1件を持つ）
 */
function createBook(): BookAggregate {
  return BookAggregate.reconstruct({
    id: BookId.of(BOOK_ID),
    userId: USER_ID,
    title: BookTitle.of("短編集"),
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
    authors: [],
  });
}

type Options = {
  book?: BookAggregate | null;
  iconExists?: boolean;
};

function createUsecase({ book = createBook(), iconExists = true }: Options = {}) {
  const createWorkRepository = {
    findBook: vi.fn<ICreateWorkRepository["findBook"]>().mockResolvedValue(book),
    createWork: vi.fn<ICreateWorkRepository["createWork"]>().mockResolvedValue(),
  } satisfies ICreateWorkRepository;
  const iconValidityRepository = {
    findValidIds: vi.fn<IIconValidityRepository["findValidIds"]>().mockImplementation(async (iconIds) => iconExists ? iconIds.map((e) => e.value) : []),
  } satisfies IIconValidityRepository;

  const usecase = new CreateWorkUsecase(
    createWorkRepository,
    new IconValidityDomainService(iconValidityRepository),
  );

  return { usecase, createWorkRepository, iconValidityRepository };
}

describe("CreateWorkUsecase", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("新しい ID・表示順の末尾・現在日時の更新日時を持つ作品を、書籍IDとともに1回保存し、追加した作品を返すこと", async () => {
    const { usecase, createWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(createWorkRepository.createWork).toHaveBeenCalledTimes(1);
    const [savedBookId, savedWork] = createWorkRepository.createWork.mock.calls[0] ?? [];
    expect(savedBookId?.value).toBe(BOOK_ID);
    const saved = savedWork?.toSnapshot();
    expect(saved?.id).toMatch(ULID_PATTERN);
    // 削除済みの作品（表示順 null）は最大値の計算に含めない
    const expected = { id: saved?.id, title: "作品3", sort: 3, memo: "作品メモ", iconId: 4, deleteFlg: false, updatedAt: NOW };
    expect(saved).toEqual(expected);
    expect(result._unsafeUnwrap().value).toEqual(expected);
  });

  it("メモが未指定の場合、メモを null にして保存すること", async () => {
    const { usecase, createWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { title: "作品3", iconId: 4 } });

    const [, savedWork] = createWorkRepository.createWork.mock.calls[0] ?? [];
    expect(savedWork?.toSnapshot().memo).toBeNull();
  });

  it("指定したユーザー・書籍IDで追加先の書籍を取得すること", async () => {
    const { usecase, createWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(createWorkRepository.findBook).toHaveBeenCalledWith(USER_ID, BookId.of(BOOK_ID));
  });

  it("書籍が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, createWorkRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(createWorkRepository.createWork).not.toHaveBeenCalled();
  });

  it("アイコンが無効な場合、INVALID_ICON を返し、保存しないこと", async () => {
    const { usecase, createWorkRepository } = createUsecase({ iconExists: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_ICON" });
    expect(createWorkRepository.createWork).not.toHaveBeenCalled();
  });

  it("削除されていない作品と作品名が重複する場合、DUPLICATE_WORK_TITLE を返し、保存しないこと", async () => {
    const { usecase, createWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { ...BODY, title: "作品2" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_WORK_TITLE", title: "作品2" });
    expect(createWorkRepository.createWork).not.toHaveBeenCalled();
  });

  it("削除済みの作品とだけ作品名が重複する場合、DUPLICATE_DELETED_WORK_TITLE を返し、保存しないこと", async () => {
    const { usecase, createWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { ...BODY, title: "削除済み作品" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_WORK_TITLE", title: "削除済み作品" });
    expect(createWorkRepository.createWork).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, createWorkRepository, iconValidityRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      bookId: BOOK_ID,
      body: { title: "", memo: "あ".repeat(2001), iconId: 0 },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "title", error: { type: "WORK_TITLE_EMPTY" } },
        { field: "memo", error: { type: "WORK_MEMO_TOO_LONG", max: 2000 } },
        { field: "iconId", error: { type: "ICON_ID_INVALID" } },
      ],
    });
    expect(createWorkRepository.findBook).not.toHaveBeenCalled();
    expect(iconValidityRepository.findValidIds).not.toHaveBeenCalled();
    expect(createWorkRepository.createWork).not.toHaveBeenCalled();
  });

  it("書籍IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, createWorkRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, bookId: "", body: BODY })).rejects.toThrow();
    expect(createWorkRepository.findBook).not.toHaveBeenCalled();
  });
});
