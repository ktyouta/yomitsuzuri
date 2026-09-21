import { cn } from '@/utils/cn';

type PropsType = {
    className?: string;
}

export function InitialLoading(props: PropsType) {
    return (
        <div className={cn("flex w-screen h-screen items-center justify-center", props.className)}>
            <p className="flex items-baseline text-base sm:text-lg text-ink-sub">
                読み込み中
                <span className="ml-0.5 flex">
                    <span className="animate-bounce [animation-delay:-0.3s]">.</span>
                    <span className="animate-bounce [animation-delay:-0.15s]">.</span>
                    <span className="animate-bounce">.</span>
                </span>
            </p>
        </div>
    );
}
