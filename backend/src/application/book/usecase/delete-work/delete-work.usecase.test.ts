import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IDeleteWorkRepository } from "../../../../domain";
import { DeleteWorkUsecase } from "./delete-work.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const DELETED_WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時 */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（削除後の作品の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  updatedAt: WORK_UPDATED_AT,
};

function createWork(id: string, title: string, sort: number | null, deleteFlg: boolean): WorkEntity {
  return WorkEntity.reconstruct({ id: WorkId.of(id), title: WorkTitle.of(title), sort: WorkSort.of(sort), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg, updatedAt: Timestamp.of(WORK_UPDATED_AT) });
}

/**
 * 削除前の書籍集約（既定では、削除されていない作品2件と、削除済みの作品1件を持つ）
 */
function createBook(works: WorkEntity[] = [
  createWork(WORK_ID_1, "作品1", 1, false),
  createWork(WORK_ID_2, "作品2", 2, false),
  createWork(DELETED_WORK_ID, "削除済み作品", null, true),
]): BookAggregate {
  return BookAggregate.reconstruct({
    id: BOOK_ID,
    userId: USER_ID,
    title: BookTitle.of("短編集"),
    publishedDate: PublishedDate.of(null),
    readingStatusId: ReadingStatusId.initial(),
    currentPage: CurrentPage.of(null),
    memo: BookMemo.of(null),
    iconId: IconId.of(1),
    deleteFlg: false,
    works,
    updatedAt: Timestamp.of(BOOK_UPDATED_AT),
  });
}

type Options = {
  book?: BookAggregate | null;
  saved?: boolean;
};

function createUsecase({ book = createBook(), saved = true }: Options = {}) {
  const deleteWorkRepository = {
    findBook: vi.fn<IDeleteWorkRepository["findBook"]>().mockResolvedValue(book),
    deleteWork: vi.fn<IDeleteWorkRepository["deleteWork"]>().mockResolvedValue(saved),
  } satisfies IDeleteWorkRepository;

  const usecase = new DeleteWorkUsecase(deleteWorkRepository);

  return { usecase, deleteWorkRepository };
}

describe("DeleteWorkUsecase", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("作品を削除済み・表示順なし・現在日時を更新日時にして1回保存し、ok を返すこと", async () => {
    const { usecase, deleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result.isOk()).toBe(true);
    expect(deleteWorkRepository.deleteWork).toHaveBeenCalledTimes(1);
    const [savedWork, expectedUpdatedAt] = deleteWorkRepository.deleteWork.mock.calls[0] ?? [];
    // 保存時の排他の条件には、画面の表示時点の更新日時を使う
    expect(expectedUpdatedAt?.value).toBe(WORK_UPDATED_AT);
    expect(savedWork?.toSnapshot()).toEqual({ id: WORK_ID_1, title: "作品1", sort: null, memo: null, iconId: 1, deleteFlg: true, updatedAt: NOW });
  });

  it("指定したユーザー・作品IDで削除対象を取得すること", async () => {
    const { usecase, deleteWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(deleteWorkRepository.findBook).toHaveBeenCalledWith(USER_ID, WorkId.of(WORK_ID_1));
  });

  it("削除対象の作品が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteWorkRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(deleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("削除対象の作品が削除済みの場合、WORK_NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORK_NOT_FOUND" });
    expect(deleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("削除対象が書籍に残る削除されていない最後の作品の場合、ALL_WORK_DELETED を返し、保存しないこと", async () => {
    const book = createBook([
      createWork(WORK_ID_1, "作品1", 1, false),
      createWork(DELETED_WORK_ID, "削除済み作品", null, true),
    ]);
    const { usecase, deleteWorkRepository } = createUsecase({ book });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "ALL_WORK_DELETED" });
    expect(deleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_WORK を返し、保存しないこと", async () => {
    const { usecase, deleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: { updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(deleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で更新されていたため保存されなかった場合、CONFLICT_WORK を返すこと", async () => {
    const { usecase, deleteWorkRepository } = createUsecase({ saved: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(deleteWorkRepository.deleteWork).toHaveBeenCalledTimes(1);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反を項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, deleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: { updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } },
      ],
    });
    expect(deleteWorkRepository.findBook).not.toHaveBeenCalled();
    expect(deleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("作品IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, deleteWorkRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow();
    expect(deleteWorkRepository.findBook).not.toHaveBeenCalled();
  });
});
