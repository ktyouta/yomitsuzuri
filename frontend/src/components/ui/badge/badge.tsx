type PropsType = {
    /** 表示テキスト */
    label: string;
    /** Tailwind の bg-* クラス。未指定時はテキストのみ表示 */
    bgColor?: string;
};

export function Badge({ label, bgColor }: PropsType) {
    if (!bgColor) return <span>{label}</span>;
    return (
        <span className={`${bgColor} text-white px-2 py-1 rounded-full text-xs lg:text-base min-w-[3rem] lg:min-w-[5rem] inline-block text-center`}>
            {label}
        </span>
    );
}
