import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

type Size = "small" | "medium" | "large";

type PropsType = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: Size;
} & Omit<ComponentPropsWithoutRef<"input">, "onChange" | "size">;

const sizeClasses: Record<Size, string> = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    large: "w-6 h-6",
};

export const Checkbox = ({
    checked,
    onChange,
    disabled = false,
    size = 'medium',
    className,
    ...rest
}: PropsType) => {

    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
                onChange(e.target.checked);
            }}
            disabled={disabled}
            className={cn(sizeClasses[size], "accent-accent", className)}
            {...rest}
        />
    );
};
