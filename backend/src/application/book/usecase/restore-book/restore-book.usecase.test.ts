import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IRestoreBookRepository } from "../../../../domain";
import { RestoreBookUsecase } from "./restore-book.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const EVENT_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FB0";
const EVENT_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FB1";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時（書籍と区別するため別の値にする） */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（復元後の書籍・作品の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  updatedAt: BOOK_UPDATED_AT,
};

function createWork(id: string, title: string, sort: number | null): WorkEntity {
  return WorkEntity.reconstruct({ id: WorkId.of(id), title: WorkTitle.of(title), sort: WorkSort.of(sort), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: true, updatedAt: Timestamp.of(WORK_UPDATED_AT) });
}

/**
 * 復元前の書籍集約（削除済み。書籍ごと削除した作品1件と、個別に削除していた作品1件を持つ）
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
    deleteFlg: true,
    works: [
      createWork(WORK_ID_1, "作品1", 1),
      createWork(WORK_ID_2, "作品2", null),
    ],
    updatedAt: Timestamp.of(BOOK_UPDATED_AT),
    authors: [],
  });
}

function createEvent(id: string, sortOrder: number | null): EventEntity {
  return EventEntity.reconstruct({ id: EventId.of(id), workId: WorkId.of(WORK_ID_1), occurredTiming: EventOccurredTiming.of(null), content: EventContent.of(`出来事${id}`), sortOrder: EventSortOrder.of(sortOrder), deleteFlg: true });
}

/**
 * 作品1の出来事の並び（すべて削除済み。個別に削除していた出来事1件と、書籍ごと削除した出来事1件を持つ）
 */
function createEventTimelineList(): EventTimelineAggregate[] {
  return [
    EventTimelineAggregate.reconstruct({
      workId: WorkId.of(WORK_ID_1),
      events: [
        createEvent(EVENT_ID_1, null),
        createEvent(EVENT_ID_2, 1),
      ],
    }),
  ];
}

type Options = {
  book?: BookAggregate | null;
  saved?: boolean;
};

function createUsecase({ book = createBook(), saved = true }: Options = {}) {
  const restoreBookRepository = {
    findBook: vi.fn<IRestoreBookRepository["findBook"]>().mockResolvedValue(book),
    findEventTimeline: vi.fn<IRestoreBookRepository["findEventTimeline"]>().mockResolvedValue(createEventTimelineList()),
    restoreBook: vi.fn<IRestoreBookRepository["restoreBook"]>().mockResolvedValue(saved),
  } satisfies IRestoreBookRepository;

  const usecase = new RestoreBookUsecase(restoreBookRepository);

  return { usecase, restoreBookRepository };
}

describe("RestoreBookUsecase", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("書籍・作品の削除済みを解除し、現在日時を更新日時にして1回保存し、復元後の書籍を返すこと（作品の表示順は U13 のとおり）", async () => {
    const { usecase, restoreBookRepository } = createUsecase();
    const before = createBook().toSnapshot();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(restoreBookRepository.restoreBook).toHaveBeenCalledTimes(1);
    const [savedBook, , expectedUpdatedAt] = restoreBookRepository.restoreBook.mock.calls[0] ?? [];
    // 保存時の排他の条件には、画面の表示時点の更新日時を使う
    expect(expectedUpdatedAt?.value).toBe(BOOK_UPDATED_AT);
    const expectedWorks = [
      // 書籍ごと削除した作品は表示順を変えない
      { id: WORK_ID_1, title: "作品1", sort: 1, memo: null, iconId: 1, deleteFlg: false, updatedAt: NOW },
      // 個別に削除していた作品は末尾に付ける
      { id: WORK_ID_2, title: "作品2", sort: 2, memo: null, iconId: 1, deleteFlg: false, updatedAt: NOW },
    ];
    expect(savedBook?.toSnapshot()).toEqual({ ...before, deleteFlg: false, updatedAt: NOW, works: expectedWorks });
    const value = result._unsafeUnwrap().value;
    expect(value.updatedAt).toBe(NOW);
    expect(value.works).toEqual(expectedWorks.map(({ id, title, sort, memo, iconId, deleteFlg }) => ({ id, title, sort, memo, iconId, deleteFlg })));
  });

  it("指定したユーザー・書籍IDで復元対象と出来事の並びを取得すること", async () => {
    const { usecase, restoreBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(restoreBookRepository.findBook).toHaveBeenCalledWith(USER_ID, BookId.of(BOOK_ID));
    expect(restoreBookRepository.findEventTimeline).toHaveBeenCalledWith(USER_ID, BookId.of(BOOK_ID));
  });

  it("作品ごとの出来事の削除済みをすべて解除し、書籍ごと削除したものは時系列順を変えず、個別に削除していたものは末尾に付けて、書籍と一緒に保存すること", async () => {
    const { usecase, restoreBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    const [, savedEventTimelineList] = restoreBookRepository.restoreBook.mock.calls[0] ?? [];
    expect(savedEventTimelineList?.map((eventTimeline) => eventTimeline.toSnapshot())).toEqual([
      [
        { id: EVENT_ID_1, workId: WORK_ID_1, occurredTiming: null, content: `出来事${EVENT_ID_1}`, sortOrder: 2, deleteFlg: false },
        { id: EVENT_ID_2, workId: WORK_ID_1, occurredTiming: null, content: `出来事${EVENT_ID_2}`, sortOrder: 1, deleteFlg: false },
      ],
    ]);
  });

  it("復元対象の書籍が存在しない場合、NOT_FOUND を返し、出来事を問い合わせず保存しないこと", async () => {
    const { usecase, restoreBookRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(restoreBookRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreBookRepository.restoreBook).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_BOOK を返し、出来事を問い合わせず保存しないこと", async () => {
    const { usecase, restoreBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(restoreBookRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreBookRepository.restoreBook).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で更新されていたため保存されなかった場合、CONFLICT_BOOK を返すこと", async () => {
    const { usecase, restoreBookRepository } = createUsecase({ saved: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(restoreBookRepository.restoreBook).toHaveBeenCalledTimes(1);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反を項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, restoreBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } },
      ],
    });
    expect(restoreBookRepository.findBook).not.toHaveBeenCalled();
    expect(restoreBookRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreBookRepository.restoreBook).not.toHaveBeenCalled();
  });

  it("書籍IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, restoreBookRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, bookId: "", body: BODY })).rejects.toThrow();
    expect(restoreBookRepository.findBook).not.toHaveBeenCalled();
  });
});
