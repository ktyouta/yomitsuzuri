import { err, ok, Result } from "neverthrow";
import { BookId, Timestamp, type BookRestoreError, type IRestoreBookRepository, type TimestampError, type UserId } from "../../../../domain";
import { RestoreBookResultDto } from "../../dto";

/**
 * 書籍復元の入力値の制約違反（field は入力値の項目名）
 */
export type RestoreBookInputError =
    { field: "updatedAt"; error: TimestampError };

export type RestoreBookError =
    | { type: "NOT_FOUND" }
    | { type: "INVALID_INPUT"; errors: RestoreBookInputError[] }
    | BookRestoreError;

type RestoreBookBody = {
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    bookId: string;
    body: RestoreBookBody;
}

/**
 * 書籍復元ユースケース
 */
export class RestoreBookUsecase {

    constructor(private readonly restoreBookRepository: IRestoreBookRepository) { }

    /**
     * 書籍復元（論理削除を解除する）
     * 書籍と作品の削除済みを解除し、更新日時を現在日時にする（docs/delete-restore/plan.md の U10）。
     * 作品の表示順は、書籍ごと削除したものは変えず、個別に削除していたものは末尾に作成順で付ける（U13。BookAggregate.restore）。
     * 著者・作品の配下（登場人物・人物関係・気になるワード・出来事）の削除済みも、あわせて復元する（U10・U14）。
     * 出来事の時系列順は、作品ごとに、作品ごと削除したものは変えず、個別に削除していたものは末尾に作成順で付ける（U13。EventTimelineAggregate.restoreAll）。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 復元対象の書籍ID
     * @param body 画面の表示時点の書籍の更新日時
     * @returns 成功時は復元後の書籍の DTO。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
     * 書籍が存在しない（他ユーザーの書籍・削除されていない書籍を含む）場合は NOT_FOUND、
     * 画面の表示後に書籍が更新された（保存時に更新されていた場合を含む）場合は CONFLICT_BOOK（いずれも保存しない）
     * @throws bookId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, bookId, body }: PropsType): Promise<Result<RestoreBookResultDto, RestoreBookError>> {
        const id = BookId.of(bookId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            Timestamp.fromInput(body.updatedAt).mapErr((error): RestoreBookInputError => ({ field: "updatedAt", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error });
        }
        const [expectedUpdatedAt] = input.value;

        // 復元対象の書籍を取得
        const book = await this.restoreBookRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // 書籍・作品の復元（排他の失敗時は、出来事を問い合わせずに返す）
        const restoreResult = book.restore({ updatedAt: Timestamp.create(), expectedUpdatedAt });
        if (restoreResult.isErr()) {
            return err(restoreResult.error);
        }

        // 作品ごとの出来事の復元
        const eventTimelineList = await this.restoreBookRepository.findEventTimeline(userId, id);
        eventTimelineList.forEach((eventTimeline) => eventTimeline.restoreAll());

        // 保存（取得後に他の操作で更新されていた場合は保存されない）
        const saved = await this.restoreBookRepository.restoreBook(book, eventTimelineList, expectedUpdatedAt);
        if (!saved) {
            return err({ type: "CONFLICT_BOOK" });
        }

        return ok(new RestoreBookResultDto(book));
    };
}
