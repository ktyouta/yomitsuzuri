import { createCtx } from '@/utils/create-ctx';
import { ReactNode, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'theme';

export type ThemeType = 'light' | 'dark';

// テーマ状態
export const ThemeContext = createCtx<ThemeType>();
// テーマ状態(setter)
export const SetThemeContext = createCtx<React.Dispatch<React.SetStateAction<ThemeType>>>();

type PropsType = {
    children: ReactNode;
};

/**
 * localStorage からテーマ初期値を取得
 */
function getInitialTheme(): ThemeType {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider(props: PropsType) {

    // テーマ状態
    const [theme, setTheme] = useState<ThemeType>(getInitialTheme);

    // 各コンポーネントで dark: クラスを動的生成しなくて済むよう、切り替え箇所を <html> 1箇所に集約する
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={theme}>
            <SetThemeContext.Provider value={setTheme}>
                {props.children}
            </SetThemeContext.Provider>
        </ThemeContext.Provider>
    );
}
