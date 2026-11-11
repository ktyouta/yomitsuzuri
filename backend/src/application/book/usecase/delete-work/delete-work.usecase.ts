import { err, ok, Result } from "neverthrow";
import { Timestamp, WorkId, type IDeleteWorkRepository, type TimestampError, type UserId, type BookWorkDeleteError } from "../../../../domain";

/**
 * 作品削除の入力値の制約違反（field は入力値の項目名）
 */
export type DeleteWorkInputError =
    { field: "updatedAt"; error: TimestampError };

export type DeleteWorkError =
    | { type: "NOT_FOUND" }
    | { type: "INVALID_INPUT"; errors: DeleteWorkInputError[] }
    | BookWorkDeleteError;

type DeleteWorkBody = {
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    workId: string;
    body: DeleteWorkBody;
}

/**
 * 作品削除ユースケース
 */
export class DeleteWorkUsecase {

    constructor(private readonly deleteWorkRepository: IDeleteWorkRepository) { }

    /**
     * 作品削除（論理削除する）
     * 作品を削除済みにし、表示順を持たない状態にして、更新日時を現在日時にする（書籍・他の作品は変更しない）。
     * 作品の配下（登場人物・人物関係・気になるワード・出来事）も、あわせて論理削除する（docs/delete-restore/plan.md の U10）。
     * @param userId 書籍を所有するユーザーID
     * @param workId 削除対象の作品ID
     * @param body 画面の表示時点の作品の更新日時
     * @returns 成功時は ok。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
     * 作品が存在しない（他ユーザーの書籍の作品・論理削除済みの書籍の作品を含む）場合は NOT_FOUND、作品が削除済みの場合は WORK_NOT_FOUND、
     * 画面の表示後に作品が更新された（保存時に更新されていた場合を含む）場合は CONFLICT_WORK、
     * 書籍に削除されていない作品が他に残らない場合は ALL_WORK_DELETED（いずれも保存しない）
     * @throws workId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, workId, body }: PropsType): Promise<Result<undefined, DeleteWorkError>> {
        const id = WorkId.of(workId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            Timestamp.fromInput(body.updatedAt).mapErr((error): DeleteWorkInputError => ({ field: "updatedAt", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error.flat() });
        }
        const [expectedUpdatedAt] = input.value;

        // 削除対象の作品を収録した書籍を取得
        const book = await this.deleteWorkRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // 作品削除
        const deleteResult = book.deleteWork({ id, expectedUpdatedAt, updatedAt: Timestamp.create() });
        if (deleteResult.isErr()) {
            return err(deleteResult.error);
        }

        // 保存（取得後に他の操作で更新されていた場合は保存されない）
        const saved = await this.deleteWorkRepository.deleteWork(deleteResult.value, expectedUpdatedAt);
        if (!saved) {
            return err({ type: "CONFLICT_WORK" });
        }

        return ok(undefined);
    };
}
