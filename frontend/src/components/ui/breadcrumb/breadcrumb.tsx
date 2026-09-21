import { HiChevronRight } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

type BreadcrumbItem = {
    label: string;
    href: string;
};

type PropsType = {
    items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: PropsType) {
    const navigate = useNavigate();

    const displayItems: (BreadcrumbItem | null)[] =
        items.length > 3
            ? [items[0], null, items[items.length - 1]]
            : items;

    return (
        <div className="flex flex-wrap items-center gap-1 text-sm text-ink-sub">
            {displayItems.map((item, index) => (
                <div key={index} className="flex items-center gap-1 min-w-0">
                    {index > 0 && <HiChevronRight className="size-3 shrink-0" />}
                    {item === null ? (
                        <span>...</span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate(item.href)}
                            className="flex items-center gap-1 text-sm text-ink-sub hover:text-ink max-w-[8rem] truncate"
                        >
                            {item.label}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
