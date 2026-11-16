import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IRestoreWorkRepository } from "../../../../domain";
import { RestoreWorkUsecase } from "./restore-work.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const DELETED_WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";
const EVENT_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FB0";
const EVENT_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FB1";
const EVENT_ID_3 = "01ARZ3NDEKTSV4RRFFQ69G5FB2";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時 */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（復元後の作品の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  updatedAt: WORK_UPDATED_AT,
};

function createWork(id: string, title: string, sort: number | null, deleteFlg: boolean): WorkEntity {
  return WorkEntity.reconstruct({ id: WorkId.of(id), title: WorkTitle.of(title), sort: WorkSort.of(sort), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg, updatedAt: Timestamp.of(WORK_UPDATED_AT) });
}

/**
 * 復元前の書籍集約（削除されていない作品2件と、削除済みの作品1件を持つ）
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
      createWork(WORK_ID_1, "作品1", 1, false),
      createWork(WORK_ID_2, "作品2", 2, false),
      createWork(DELETED_WORK_ID, "削除済み作品", null, true),
    ],
    updatedAt: Timestamp.of(BOOK_UPDATED_AT),
  });
}

function createEvent(id: string, sortOrder: number | null): EventEntity {
  return EventEntity.reconstruct({ id: EventId.of(id), workId: WorkId.of(DELETED_WORK_ID), occurredTiming: EventOccurredTiming.of(null), content: EventContent.of(`出来事${id}`), sortOrder: EventSortOrder.of(sortOrder), deleteFlg: true });
}

/**
 * 復元対象の作品内の出来事の並び（すべて削除済み。個別に削除していた出来事1件と、作品ごと削除した出来事2件を持つ）
 */
function createEventTimeline(): EventTimelineAggregate {
  return EventTimelineAggregate.reconstruct({
    workId: WorkId.of(DELETED_WORK_ID),
    events: [
      createEvent(EVENT_ID_1, null),
      createEvent(EVENT_ID_2, 1),
      createEvent(EVENT_ID_3, 2),
    ],
  });
}

type Options = {
  book?: BookAggregate | null;
  eventTimeline?: EventTimelineAggregate;
  saved?: boolean;
};

function createUsecase({ book = createBook(), eventTimeline = createEventTimeline(), saved = true }: Options = {}) {
  const restoreWorkRepository = {
    findBook: vi.fn<IRestoreWorkRepository["findBook"]>().mockResolvedValue(book),
    findEventTimeline: vi.fn<IRestoreWorkRepository["findEventTimeline"]>().mockResolvedValue(eventTimeline),
    restoreWork: vi.fn<IRestoreWorkRepository["restoreWork"]>().mockResolvedValue(saved),
  } satisfies IRestoreWorkRepository;

  const usecase = new RestoreWorkUsecase(restoreWorkRepository);

  return { usecase, restoreWorkRepository };
}

describe("RestoreWorkUsecase", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("作品の削除済みを解除し、表示順を末尾・現在日時を更新日時にして1回保存し、復元後の作品を返すこと", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    expect(restoreWorkRepository.restoreWork).toHaveBeenCalledTimes(1);
    const [savedWork, , expectedUpdatedAt] = restoreWorkRepository.restoreWork.mock.calls[0] ?? [];
    // 保存時の排他の条件には、画面の表示時点の更新日時を使う
    expect(expectedUpdatedAt?.value).toBe(WORK_UPDATED_AT);
    const expected = { id: DELETED_WORK_ID, title: "削除済み作品", sort: 3, memo: null, iconId: 1, deleteFlg: false, updatedAt: NOW };
    expect(savedWork?.toSnapshot()).toEqual(expected);
    expect(result._unsafeUnwrap().value).toEqual(expected);
  });

  it("指定したユーザー・作品IDで復元対象を取得すること", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    expect(restoreWorkRepository.findBook).toHaveBeenCalledWith(USER_ID, WorkId.of(DELETED_WORK_ID));
    expect(restoreWorkRepository.findEventTimeline).toHaveBeenCalledWith(USER_ID, WorkId.of(DELETED_WORK_ID));
  });

  it("作品内の出来事の削除済みをすべて解除し、作品ごと削除したものは時系列順を変えず、個別に削除していたものは末尾に付けて、作品と一緒に保存すること", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    const [, savedEventTimeline] = restoreWorkRepository.restoreWork.mock.calls[0] ?? [];
    expect(savedEventTimeline?.toSnapshot()).toEqual([
      { id: EVENT_ID_1, workId: DELETED_WORK_ID, occurredTiming: null, content: `出来事${EVENT_ID_1}`, sortOrder: 3, deleteFlg: false },
      { id: EVENT_ID_2, workId: DELETED_WORK_ID, occurredTiming: null, content: `出来事${EVENT_ID_2}`, sortOrder: 1, deleteFlg: false },
      { id: EVENT_ID_3, workId: DELETED_WORK_ID, occurredTiming: null, content: `出来事${EVENT_ID_3}`, sortOrder: 2, deleteFlg: false },
    ]);
  });

  it("復元対象の作品が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreWorkRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(restoreWorkRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreWorkRepository.restoreWork).not.toHaveBeenCalled();
  });

  it("復元対象の作品が削除されていない場合、WORK_NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID_1, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "WORK_NOT_FOUND" });
    expect(restoreWorkRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreWorkRepository.restoreWork).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_WORK を返し、保存しないこと", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: { updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(restoreWorkRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreWorkRepository.restoreWork).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で更新されていたため保存されなかった場合、CONFLICT_WORK を返すこと", async () => {
    const { usecase, restoreWorkRepository } = createUsecase({ saved: false });

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(restoreWorkRepository.restoreWork).toHaveBeenCalledTimes(1);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反を項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: DELETED_WORK_ID, body: { updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } }],
    });
    expect(restoreWorkRepository.findBook).not.toHaveBeenCalled();
    expect(restoreWorkRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreWorkRepository.restoreWork).not.toHaveBeenCalled();
  });

  it("作品IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, restoreWorkRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow();
    expect(restoreWorkRepository.findBook).not.toHaveBeenCalled();
  });
});
