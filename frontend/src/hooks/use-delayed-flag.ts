import { useEffect, useState } from "react";

/**
 * フラグが true になってから一定時間経過後に true を返す
 * @param flag 監視するフラグ
 * @param delay true を返すまでの待ち時間（ミリ秒）
 * @returns 遅延後のフラグ
 */
export function useDelayedFlag(flag: boolean, delay: number): boolean {

    // 遅延後のフラグ
    const [delayed, setDelayed] = useState(false);
    // 前回レンダー時のフラグ（フラグの変化を検知するため）
    const [prevFlag, setPrevFlag] = useState(flag);

    // フラグが false に変わったら即座にリセットする
    if (flag !== prevFlag) {
        setPrevFlag(flag);
        if (!flag) {
            setDelayed(false);
        }
    }

    useEffect(() => {
        if (!flag) {
            return;
        }
        const timer = setTimeout(() => setDelayed(true), delay);
        return () => clearTimeout(timer);
    }, [flag, delay]);

    return delayed;
}
