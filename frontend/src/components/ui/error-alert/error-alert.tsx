import { cn } from "@/utils/cn";
import { type ReactNode } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

type PropsType = {
    /** エラー内容 */
    children: ReactNode;
    /** 余白・文字サイズ等を上書きするTailwindクラス */
    className?: string;
};

/**
 * 処理失敗時のエラーメッセージ枠
 */
export function ErrorAlert({ children, className }: PropsType) {
    return (
        <div className={cn("flex items-start gap-3 rounded-lg border border-danger-border bg-danger-bg p-4 text-base text-danger", className)}>
            <HiOutlineExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>{children}</div>
        </div>
    );
}
