type SelectOption = {
    label: string;
    value: string;
};

/**
 * うるう年判定
 */
function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 指定された年月の日数を取得する
 */
function getDaysInMonth(year: number, month: number): number {

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2 && isLeapYear(year)) {
        return 29;
    }

    return daysInMonth[month - 1];
}

/**
 * 指定された年月に基づいて、日の選択肢リストを返す
 * @param year 年（文字列または数値）
 * @param month 月（文字列または数値、1-12）
 * @returns 日の選択肢リスト
 */
export function getDayList(year: number | string, month: number | string): SelectOption[] {

    const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
    const monthNum = typeof month === 'string' ? parseInt(month, 10) : month;

    // 無効な値の場合は31日分を返す
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return createDayList(31);
    }

    const days = getDaysInMonth(yearNum, monthNum);
    return createDayList(days);
}

/**
 * 指定された日数分の選択肢リストを生成する
 */
function createDayList(days: number): SelectOption[] {
    const list: SelectOption[] = [];

    for (let i = 1; i <= days; i++) {
        const value = i.toString().padStart(2, '0');
        list.push({
            label: i.toString(),
            value: value,
        });
    }

    return list;
}
