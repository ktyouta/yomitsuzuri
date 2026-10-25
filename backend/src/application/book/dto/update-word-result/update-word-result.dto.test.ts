import { describe, it, expect } from "vitest";
import { UpdateWordResultDto } from "..";
import { WordEntity, WordId, WordMemo, WordPage, WordText, WorkId } from "../../../../domain/book";

function createWord(memo: string | null, page: number | null) {
  return WordEntity.reconstruct({
    id: WordId.of("01BX5ZZKBKACTAV9WEVGEMMVT0"),
    workId: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"),
    text: WordText.of("赤い手帳"),
    memo: WordMemo.of(memo),
    page: WordPage.of(page),
    deleteFlg: false,
  });
}

describe("UpdateWordResultDto", () => {
  it("気になるワードからDTOを生成できること", () => {
    const dto = new UpdateWordResultDto(createWord("メモ", 42));

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      text: "赤い手帳",
      memo: "メモ",
      page: 42,
    });
  });

  it("メモ・ページが null の場合、null のまま返すこと", () => {
    const dto = new UpdateWordResultDto(createWord(null, null));

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
      text: "赤い手帳",
      memo: null,
      page: null,
    });
  });
});
