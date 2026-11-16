import { err, ok, Result } from "neverthrow";
import { Timestamp, WorkId, type BookWorkRestoreError, type IRestoreWorkRepository, type TimestampError, type UserId } from "../../../../domain";
import { RestoreWorkResultDto } from "../../dto";

/**
 * 作品復元の入力値の制約違反（field は入力値の項目名）
 */
export type RestoreWorkInputError =
    { field: "updatedAt"; error: TimestampError };

export type RestoreWorkError =
    | { type: "INVALID_INPUT"; errors: RestoreWorkInputError[] }
    | { type: "NOT_FOUND" }
    | BookWorkRestoreError;

type RestoreWorkBody = {
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    workId: string;
    body: RestoreWorkBody;
}

/**
 * 作品復元ユースケース
 */
export class RestoreWorkUsecase {

    constructor(private readonly restoreWorkRepository: IRestoreWorkRepository) { }

    /**
     * 作品復元（論理削除を解除する）
     * 作品の削除済みを解除し、表示順を削除されていない作品の最大値+1（末尾）、更新日時を現在日時にする（書籍・他の作品は変更しない。docs/delete-restore/plan.md の U13）。
     * 作品の配下（登場人物・人物関係・気になるワード・出来事）の削除済みも、あわせて復元する（docs/delete-restore/plan.md の U10）。
     * 出来事の時系列順は、作品ごと削除したものは変えず、個別に削除していたものは末尾に作成順で付ける（U13。EventTimelineAggregate.restoreAll）。
     * @param userId 書籍を所有するユーザーID
     * @param workId 復元対象の作品ID
     * @param body 画面の表示時点の作品の更新日時
     * @returns 成功時は復元後の作品の DTO。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
     * 作品が存在しない（他ユーザーの書籍の作品・論理削除済みの書籍の作品を含む）場合は NOT_FOUND、作品が削除されていない場合は WORK_NOT_FOUND、
     * 画面の表示後に作品が更新された（保存時に更新されていた場合を含む）場合は CONFLICT_WORK（いずれも保存しない）
     * @throws workId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, workId, body }: PropsType): Promise<Result<RestoreWorkResultDto, RestoreWorkError>> {
        const id = WorkId.of(workId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            Timestamp.fromInput(body.updatedAt).mapErr((error): RestoreWorkInputError => ({ field: "updatedAt", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error });
        }
        const [expectedUpdatedAt] = input.value;

        // 復元対象の作品を収録した書籍を取得
        const book = await this.restoreWorkRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // 作品復元
        const restoreResult = book.restoreWork({
            id,
            expectedUpdatedAt,
            updatedAt: Timestamp.create(),
        });
        if (restoreResult.isErr()) {
            return err(restoreResult.error);
        }

        const work = restoreResult.value;

        // 作品の配下の出来事を復元
        const eventTimeline = await this.restoreWorkRepository.findEventTimeline(userId, work.id);

        eventTimeline.restoreAll();

        // 保存（取得後に他の操作で更新されていた場合は保存されない）
        const saved = await this.restoreWorkRepository.restoreWork(work, eventTimeline, expectedUpdatedAt);
        if (!saved) {
            return err({ type: "CONFLICT_WORK" });
        }

        return ok(new RestoreWorkResultDto(work));
    };
}
