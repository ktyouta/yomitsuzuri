import { useEffect, useState } from "react";
import { HiArrowUp } from "react-icons/hi2";

export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setIsVisible(window.scrollY > 300);
        }
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="ページトップへ戻る"
            className="fixed bottom-[68px] right-6 z-50 flex items-center justify-center w-11 h-11 rounded-lg bg-accent text-white shadow-md [@media(hover:hover)]:hover:bg-accent-hover transition-colors"
        >
            <HiArrowUp className="size-5" />
        </button>
    );
}
