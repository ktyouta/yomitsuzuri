type PropsType = {
    className?: string;
};

export function Footer({ className = '' }: PropsType) {
    return (
        <footer className={`flex h-10 items-center justify-start px-6 ${className}`}>
            <span className="text-xs sm:text-sm text-ink-sub">© 2026 React Hono RPC DDD Template. All rights reserved.</span>
        </footer>
    );
}
