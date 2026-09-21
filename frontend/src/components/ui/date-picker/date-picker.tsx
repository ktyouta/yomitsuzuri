import { cn } from "@/utils/cn";
import { ja } from "date-fns/locale";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./date-picker.css";

type PropsType = {
    value: string | null;
    onChange: (date: string | null) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
};

function parseDate(value: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function DatePicker({ value, onChange, disabled, placeholder, className }: PropsType) {
    return (
        <ReactDatePicker
            locale={ja}
            dateFormat="yyyy/MM/dd"
            selected={parseDate(value)}
            onChange={(date: Date | null) => onChange(formatDate(date))}
            disabled={disabled}
            placeholderText={placeholder ?? "日付を選択"}
            isClearable={!disabled}
            wrapperClassName="flex-1"
            className={cn(
                "w-full border border-line rounded px-3 py-2 text-base bg-surface text-ink",
                "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                "disabled:bg-canvas disabled:cursor-not-allowed disabled:text-ink-sub",
                className
            )}
        />
    );
}
