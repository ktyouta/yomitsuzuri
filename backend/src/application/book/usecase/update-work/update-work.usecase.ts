import { err, ok, Result } from "neverthrow";
import { IconId, Timestamp, WorkId, WorkMemo, WorkTitle, type BookWorkUpdateError, type IconIdError, type IconValidityDomainService, type IUpdateWorkRepository, type TimestampError, type UserId, type WorkMemoError, type WorkTitleError } from "../../../../domain";
import { UpdateWorkResultDto } from "../../dto";

/**
 * 作品更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateWorkInputError =
    | { field: "title"; error: WorkTitleError }
    | { field: "memo"; error: WorkMemoError }
    | { field: "iconId"; error: IconIdError }
    | { field: "updatedAt"; error: TimestampError };

export type UpdateWorkError =
    | { type: "INVALID_INPUT"; errors: UpdateWorkInputError[] }
    | { type: "NOT_FOUND" }
    | { type: "INVALID_ICON" }
    | BookWorkUpdateError;

type UpdateWorkBody = {
    title: string;
    memo?: string | null;
    iconId: number;
    updatedAt: string;
};

type PropsType = {
    userId: UserId;
    workId: string;
    body: UpdateWorkBody;
}

export class UpdateWorkUsecase {

    constructor(private readonly updateWorkRepository: IUpdateWorkRepository,
        private readonly iconValidityService: IconValidityDomainService,) { }

    /**
     * 作品更新
     * 作品名・メモ・アイコンを更新する（表示順・削除フラグと、書籍・他の作品は変更しない）。
     * @param userId 書籍を所有するユーザーID
     * @param workId 更新対象の作品ID
     * @param body 作品の更新内容と、画面の表示時点の作品の更新日時
     * @returns 成功時は更新後の作品の DTO。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・作品が存在しない（他ユーザーの書籍の作品・論理削除済みの書籍の作品を含む）・アイコンが無効・作品が削除済み・
     * 画面の表示後に作品が更新された（保存時に更新されていた場合を含む）・同名の作品が書籍に存在する（自身を除き、削除済みを含む。削除済みだけの場合は DUPLICATE_DELETED_WORK_TITLE）場合はエラー（いずれも保存しない）
     * @throws workId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, workId, body }: PropsType): Promise<Result<UpdateWorkResultDto, UpdateWorkError>> {
        const id = WorkId.of(workId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            WorkTitle.create(body.title).mapErr((error): UpdateWorkInputError => ({ field: "title", error })),
            WorkMemo.create(body.memo).mapErr((error): UpdateWorkInputError => ({ field: "memo", error })),
            IconId.create(body.iconId).mapErr((error): UpdateWorkInputError => ({ field: "iconId", error })),
            Timestamp.fromInput(body.updatedAt).mapErr((error): UpdateWorkInputError => ({ field: "updatedAt", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error });
        }
        const [title, memo, iconId, expectedUpdatedAt] = input.value;

        // 更新対象の作品を収録した書籍を取得
        const book = await this.updateWorkRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // アイコンチェック
        if (!(await this.iconValidityService.isValid(iconId))) {
            return err({ type: "INVALID_ICON" });
        }

        // 作品情報更新
        const updateResult = book.updateWork({
            id,
            title,
            memo,
            iconId,
            expectedUpdatedAt,
            updatedAt: Timestamp.create(),
        });
        if (updateResult.isErr()) {
            return err(updateResult.error);
        }
        const work = updateResult.value;

        // 更新（取得後に他の操作で更新されていた場合は保存されない）
        const saved = await this.updateWorkRepository.updateWork(work, expectedUpdatedAt);
        if (!saved) {
            return err({ type: "CONFLICT_WORK" });
        }

        return ok(new UpdateWorkResultDto(work));
    };
}
