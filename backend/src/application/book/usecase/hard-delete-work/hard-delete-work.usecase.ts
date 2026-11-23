import { err, ok, Result } from "neverthrow";
import { Timestamp, WorkId, type IHardDeleteWorkRepository, type TimestampError, type UserId } from "../../../../domain";

/**
 * 作品の物理削除の入力値の制約違反（field は入力値の項目名）
 */
export type HardDeleteWorkInputError =
    { field: "updatedAt"; error: TimestampError };

export type HardDeleteWorkError =
    | { type: "NOT_FOUND" }
    | { type: "CONFLICT_WORK" }
    | { type: "INVALID_INPUT"; errors: HardDeleteWorkInputError[] }

type HardDeleteWorkBody = {
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    workId: string;
    body: HardDeleteWorkBody;
}

/**
 * 作品の物理削除ユースケース
 */
export class HardDeleteWorkUsecase {

    constructor(private readonly hardDeleteWorkRepository: IHardDeleteWorkRepository) { }

    /**
     * 作品の物理削除
     * 論理削除済みの作品と、作品の配下をすべて物理削除する（書籍・他の作品は変更しない）。
     * @param userId 作品を収録した書籍を所有するユーザーID
     * @param workId 物理削除の対象の作品ID
     * @param body 画面の表示時点の作品の更新日時
     * @returns 成功時は ok。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
     * 作品が存在しない（他ユーザーの書籍の作品・削除されていない作品を含む）場合は NOT_FOUND、
     * 画面の表示後に作品が復元・更新された（削除時に更新されていた場合を含む）場合は CONFLICT_WORK（いずれも削除しない）
     * @throws workId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, workId, body }: PropsType): Promise<Result<undefined, HardDeleteWorkError>> {
        const id = WorkId.of(workId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            Timestamp.fromInput(body.updatedAt).mapErr((error): HardDeleteWorkInputError => ({ field: "updatedAt", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error.flat() });
        }
        const [expectedUpdatedAt] = input.value;

        // 物理削除の対象の作品を取得
        const work = await this.hardDeleteWorkRepository.findWork(userId, id);
        if (!work) {
            return err({ type: "NOT_FOUND" });
        }
        if (!work.updatedAt.equals(expectedUpdatedAt)) {
            return err({ type: "CONFLICT_WORK" });
        }

        // 物理削除（取得後に他の操作で復元・更新されていた場合は削除されない）
        const deleted = await this.hardDeleteWorkRepository.deleteWork(id, expectedUpdatedAt);
        if (!deleted) {
            return err({ type: "CONFLICT_WORK" });
        }

        return ok(undefined);
    };
}
