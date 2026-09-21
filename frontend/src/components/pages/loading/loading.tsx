import { cn } from '@/utils/cn';
import { Spinner } from '../..';

type PropsType = {
    fullScreen?: boolean;
    className?: string;
}

export function Loading(props: PropsType) {

    // 画面全体表示するかどうか
    const fullScreen = props.fullScreen ?? true;

    return (
        <div className={cn("flex items-center justify-center", fullScreen && "w-screen h-screen", props.className)}>
            <Spinner className="size-8 sm:size-12" />
        </div>
    );
}
