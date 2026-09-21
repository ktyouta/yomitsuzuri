import { cn } from "@/utils/cn";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

type PropsType = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

// 常に7スロット固定で返す（totalPages > 7 の場合）
// 例: 1 2 3 4 5 ... N  /  1 ... P-1 P P+1 ... N  /  1 ... N-4 N-3 N-2 N-1 N
function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {

    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 2) {
        return [1, 2, 3, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export function Pagination({ currentPage, totalPages, onPageChange }: PropsType) {

    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <div className="flex items-center justify-center gap-1 py-2">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="前のページ"
                className={cn(
                    "flex items-center justify-center w-9 h-9 rounded",
                    currentPage === 1
                        ? "text-ink-sub/40 cursor-not-allowed"
                        : "text-ink-sub hover:bg-canvas"
                )}
            >
                <HiChevronLeft className="size-5" />
            </button>
            {pages.map((page, i) =>
                page === '...' ? (
                    <span
                        key={`ellipsis-${i}`}
                        className="w-9 h-9 flex items-center justify-center text-ink-sub/70 text-sm select-none"
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        aria-label={`${page}ページ`}
                        aria-current={currentPage === page ? "page" : undefined}
                        className={cn(
                            "w-9 h-9 rounded text-sm",
                            currentPage === page
                                ? "bg-accent text-white font-medium"
                                : "text-ink-sub hover:bg-canvas"
                        )}
                    >
                        {page}
                    </button>
                )
            )}
            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="次のページ"
                className={cn(
                    "flex items-center justify-center w-9 h-9 rounded",
                    currentPage === totalPages
                        ? "text-ink-sub/40 cursor-not-allowed"
                        : "text-ink-sub hover:bg-canvas"
                )}
            >
                <HiChevronRight className="size-5" />
            </button>
        </div>
    );
}
