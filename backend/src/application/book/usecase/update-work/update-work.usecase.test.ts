import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { UpdateWorkUsecase } from "./update-work.usecase";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, IconValidityDomainService, PublishedDate, ReadingStatusId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IIconValidityRepository, type IUpdateWorkRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const DELETED_WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時 */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（更新後の作品の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  title: "作品1改",
  memo: "作品メモ",
  iconId: 4,
  updatedAt: WORK_UPDATED_AT,
};

/**
 * 更新前の書籍集約（削除されていない作品2件と、削除済みの作品1件を持つ）
 */
function createBook(): BookAggregate {
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
    works: [
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false, updatedAt: WORK_UPDATED_AT }),
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false, updatedAt: WORK_UPDATED_AT }),
      WorkEntity.reconstruct({ id: WorkId.of(DELETED_WORK_ID), title: WorkTitle.of("削除済み作品"), sort: WorkSort.of(null), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: true, updatedAt: WORK_UPDATED_AT }),
    ],
    updatedAt: BOOK_UPDATED_AT,
  });
}

type Options = {
  book?: BookAggregate | null;
  iconExists?: boolean;
  saved?: boolean;
};

function createUsecase({ book = createBook(), iconExists = true, saved = true }: Options = {}) {
  const updateWorkRepository = {
    findBook: vi.fn<IUpdateWorkRepository["findBook"]>().mockResolvedValue(book),
    updateWork: vi.fn<IUpdateWorkRepository["updateWork"]>().mockResolvedValue(saved),
  } satisfies IUpdateWorkRepository;
  const iconValidityRepository = {
    findValidIds: vi.fn<IIconValidityRepository["findValidIds"]>().mockImplementation(async (iconIds) => iconExists ? iconIds.map((e) => e.value) : []),
  } satisfies IIconValidityRepository;

  const usecase = new UpdateWorkUsecase(
    updateWorkRepository,
    new IconValidityDomainService(iconValidityRepository),
  );

  return { usecase, updateWorkRepository, iconValidityRepository };
}

describe("UpdateWorkUsecase", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("作品名・メモ・アイコンを、現在日時を更新日時として保存し、更新後の作品を返すこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(updateWorkRepository.updateWork).toHaveBeenCalledTimes(1);
    const [savedWork, expectedUpdatedAt] = updateWorkRepository.updateWork.mock.calls[0] ?? [];
    // 保存時の排他の条件には、画面の表示時点の更新日時を使う
    expect(expectedUpdatedAt).toBe(WORK_UPDATED_AT);
    const expected = { id: WORK_ID_1, title: "作品1改", sort: 1, memo: "作品メモ", iconId: 4, deleteFlg: false, updatedAt: NOW };
    expect(savedWork?.toSnapshot()).toEqual(expected);
    expect(result._unsafeUnwrap().value).toEqual(expected);
  });

  it("指定したユーザー・作品IDで更新対象を取得すること", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(updateWorkRepository.findBook).toHaveBeenCalledWith(USER_ID, WorkId.of(WORK_ID_1));
  });

  it("更新対象の作品が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("アイコンが無効な場合、INVALID_ICON を返し、保存しないこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase({ iconExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_ICON" });
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("更新対象の作品が削除済みの場合、WORK_NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORK_NOT_FOUND" });
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_WORK を返し、保存しないこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: { ...BODY, updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で更新されていたため保存されなかった場合、CONFLICT_WORK を返すこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase({ saved: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(updateWorkRepository.updateWork).toHaveBeenCalledTimes(1);
  });

  it("削除されていない他の作品と作品名が重複する場合、DUPLICATE_WORK_TITLE を返し、保存しないこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: { ...BODY, title: "作品2" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_WORK_TITLE", title: "作品2" });
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("削除済みの作品とだけ作品名が重複する場合、DUPLICATE_DELETED_WORK_TITLE を返し、保存しないこと", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: { ...BODY, title: "削除済み作品" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_WORK_TITLE", title: "削除済み作品" });
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateWorkRepository, iconValidityRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID_1,
      body: { title: "", memo: "あ".repeat(2001), iconId: 0, updatedAt: WORK_UPDATED_AT },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "title", error: { type: "WORK_TITLE_EMPTY" } },
        { field: "memo", error: { type: "WORK_MEMO_TOO_LONG", max: 2000 } },
        { field: "iconId", error: { type: "ICON_ID_INVALID" } },
      ],
    });
    expect(updateWorkRepository.findBook).not.toHaveBeenCalled();
    expect(iconValidityRepository.findValidIds).not.toHaveBeenCalled();
    expect(updateWorkRepository.updateWork).not.toHaveBeenCalled();
  });

  it("作品IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, updateWorkRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow();
    expect(updateWorkRepository.findBook).not.toHaveBeenCalled();
  });
});
