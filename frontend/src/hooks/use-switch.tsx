import { useCallback, useMemo, useState } from 'react';

export function useSwitch() {

    //フラグ
    const [flag, setFlag] = useState(false);

    //フラグオン
    const on = useCallback(() => {
        setFlag(true);
    }, []);

    //フラグオフ
    const off = useCallback(() => {
        setFlag(false);
    }, []);

    return useMemo(() => ({ flag, on, off }), [flag, on, off]);
}
