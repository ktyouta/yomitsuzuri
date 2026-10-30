import { err, ok, type Result } from "neverthrow";
import { WorkId, type IGetListEventRepository, type UserId } from "../../../../domain";
import { GetListEventResultDto } from "../../dto";

export type GetListEventError = { type: "NOT_FOUND" };

type PropsType = {
  userId: UserId;
  workId: string;
}

/**
 * 出来事一覧取得ユースケース
 */
export class GetListEventUsecase {
  constructor(private readonly repository: IGetListEventRepository) { }

  /**
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 成功時は作品の出来事一覧の DTO（0件の場合は空の一覧）、作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は NOT_FOUND
   * @throws workId が空の場合（作品・出来事は問い合わせない）
   */
  async execute({ userId, workId }: PropsType): Promise<Result<GetListEventResultDto, GetListEventError>> {
    const id = WorkId.of(workId);

    const [work, events] = await Promise.all([
      this.repository.findWork(userId, id),
      this.repository.findEventList(userId, id),
    ]);

    if (!work) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(new GetListEventResultDto(events));
  }
}
