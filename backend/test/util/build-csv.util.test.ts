import { describe, expect, it } from "vitest";
import { buildCsv } from "../../src/util";

describe("buildCsv", () => {
  it("先頭にBOMが付与されること", () => {
    const csv = buildCsv(["a"], []);

    expect(csv.startsWith("﻿")).toBe(true);
  });

  it("ヘッダー行とデータ行がカンマ区切り・CRLF区切りで出力されること", () => {
    const csv = buildCsv(["名前", "年齢"], [["太郎", "20"], ["花子", "30"]]);

    expect(csv).toBe("﻿名前,年齢\r\n太郎,20\r\n花子,30");
  });

  it("カンマ・改行を含む値は二重引用符で囲まれること", () => {
    const csv = buildCsv(["メモ"], [["a,b"], ["line1\nline2"]]);

    expect(csv).toBe("﻿メモ\r\n\"a,b\"\r\n\"line1\nline2\"");
  });

  it("二重引用符を含む値は二重引用符が二重にエスケープされること", () => {
    const csv = buildCsv(["メモ"], [["say \"hi\""]]);

    expect(csv).toBe("﻿メモ\r\n\"say \"\"hi\"\"\"");
  });
});
