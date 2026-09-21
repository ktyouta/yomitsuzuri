import { type ReactNode, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

type Side = "top" | "bottom" | "left" | "right";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    description?: string;
    side?: Side;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    widthClassName?: string;
};

const sideClasses: Record<Side, string> = {
    top: "inset-x-0 top-0 border-b animate-slide-in-from-top",
    bottom: "inset-x-0 bottom-0 border-t animate-slide-in-from-bottom",
    left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r animate-slide-in-from-left",
    right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l animate-slide-in-from-right",
};

export function Drawer({
    isOpen,
    onClose,
    children,
    title,
    description,
    side = "right",
    closeOnOverlayClick = true,
    closeOnEscape = true,
    widthClassName,
}: Props) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (closeOnEscape && event.key === "Escape") {
                onClose();
            }
        },
        [closeOnEscape, onClose]
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose();
        }
    };

    const handleContentClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "drawer-title" : undefined}
            aria-describedby={description ? "drawer-description" : undefined}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 animate-fade-in"
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Drawer Content */}
            <div
                className={cn(
                    "fixed z-10 bg-surface shadow-xl p-6",
                    sideClasses[side],
                    widthClassName
                )}
                onClick={handleContentClick}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 text-ink-sub hover:text-ink rounded-full hover:bg-canvas"
                    aria-label="閉じる"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Header */}
                {(title || description) && (
                    <div className="mb-4 pr-8">
                        {title && (
                            <h2
                                id="drawer-title"
                                className="text-lg font-semibold text-ink"
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p
                                id="drawer-description"
                                className="mt-1 text-sm text-ink-sub"
                            >
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Body */}
                <div>{children}</div>
            </div>
        </div>,
        document.body
    );
}
