import { err, ok, Result } from "neverthrow";
import { BookId, IconId, Timestamp, WorkMemo, WorkTitle, type BookWorkCreateError, type IconIdError, type IconValidityDomainService, type ICreateWorkRepository, type UserId, type WorkMemoError, type WorkTitleError } from "../../../../domain";
import { CreateWorkResultDto } from "../../dto";

/**
 * 作品追加の入力値の制約違反（field は入力値の項目名）
 */
export type CreateWorkInputError =
    | { field: "title"; error: WorkTitleError }
    | { field: "memo"; error: WorkMemoError }
    | { field: "iconId"; error: IconIdError };

export type CreateWorkError =
    | { type: "INVALID_INPUT"; errors: CreateWorkInputError[] }
    | { type: "NOT_FOUND" }
    | { type: "INVALID_ICON" }
    | BookWorkCreateError;

type CreateWorkBody = {
    title: string;
    memo?: string | null;
    iconId: number;
};

type PropsType = {
    userId: UserId;
    bookId: string;
    body: CreateWorkBody;
}

/**
 * 作品追加ユースケース
 */
export class CreateWorkUsecase {

    constructor(private readonly createWorkRepository: ICreateWorkRepository,
        private readonly iconValidityService: IconValidityDomainService,) { }

    /**
     * 作品追加
     * 書籍に作品を追加する。表示順は削除されていない作品の最大値+1（末尾）、更新日時は現在日時にする（書籍・他の作品は変更しない）。
     * @param userId 書籍を所有するユーザーID
     * @param bookId 作品を追加する書籍ID
     * @param body 追加する作品の作品名・メモ・アイコン
     * @returns 成功時は追加した作品の DTO。
     * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
     * 書籍が存在しない（他ユーザーの書籍・論理削除済みの書籍を含む）場合は NOT_FOUND、アイコンが無効な場合は INVALID_ICON、
     * 削除されていない作品と作品名が重複する場合は DUPLICATE_WORK_TITLE、削除済みの作品とだけ重複する場合は DUPLICATE_DELETED_WORK_TITLE（いずれも保存しない）
     * @throws bookId が空の場合（DB は問い合わせない）
     */
    async execute({ userId, bookId, body }: PropsType): Promise<Result<CreateWorkResultDto, CreateWorkError>> {
        const id = BookId.of(bookId);

        // 入力値の制約チェック
        const input = Result.combineWithAllErrors([
            WorkTitle.create(body.title).mapErr((error): CreateWorkInputError => ({ field: "title", error })),
            WorkMemo.create(body.memo).mapErr((error): CreateWorkInputError => ({ field: "memo", error })),
            IconId.create(body.iconId).mapErr((error): CreateWorkInputError => ({ field: "iconId", error })),
        ]);
        if (input.isErr()) {
            return err({ type: "INVALID_INPUT", errors: input.error });
        }
        const [title, memo, iconId] = input.value;

        // 作品を追加する書籍を取得
        const book = await this.createWorkRepository.findBook(userId, id);
        if (!book) {
            return err({ type: "NOT_FOUND" });
        }

        // アイコンチェック
        if (!(await this.iconValidityService.isValid(iconId))) {
            return err({ type: "INVALID_ICON" });
        }

        // 作品追加
        const createResult = book.createWork({
            title,
            memo,
            iconId,
            updatedAt: Timestamp.create(),
        });
        if (createResult.isErr()) {
            return err(createResult.error);
        }
        const work = createResult.value;

        // 保存
        await this.createWorkRepository.createWork(id, work);

        return ok(new CreateWorkResultDto(work));
    };
}
