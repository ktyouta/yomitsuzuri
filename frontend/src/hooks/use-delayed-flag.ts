import { useEffect, useState } from "react";

export function useDelayedFlag(flag: boolean, delay: number): boolean {

    // 遅延後のフラグ
    const [delayed, setDelayed] = useState(false);

    useEffect(() => {
        if (flag) {
            const timer = setTimeout(() => setDelayed(true), delay);
            return () => clearTimeout(timer);
        }
        setDelayed(false);
    }, [flag, delay]);

    return delayed;
}
