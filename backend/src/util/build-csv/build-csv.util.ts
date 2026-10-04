/**
 * CSVフィールド値をエスケープする（カンマ・ダブルクォート・改行を含む場合は二重引用符で囲み、内部の二重引用符は二重にする）
 */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * ヘッダー行とデータ行からBOM付きCSV文字列を組み立てる（Excelでの文字化け防止のためBOMを付与）
 */
export function buildCsv(headers: string[], rows: string[][]): string {
  const BOM = "﻿";
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvField).join(","));
  return BOM + lines.join("\r\n");
}
