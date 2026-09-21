import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type Color = "red" | "blue" | "green";
type Size = "small" | "medium" | "large";

export type PropsType = Omit<ComponentPropsWithoutRef<"button">, "color"> & {
    colorType: Color,
    sizeType: Size,
    children: ReactNode,
};

const colorClasses: Record<Color, string> = {
    red: "bg-red-500 hover:bg-red-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
};

const sizeClasses: Record<Size, string> = {
    small: "py-1 px-3 text-xs",
    medium: "py-1.5 px-4 text-sm",
    large: "py-2.5 px-5 text-base",
};

export const Button = ({ colorType, sizeType, children, className, ...props }: PropsType) => {

    return (
        <button
            type="button"
            {...props}
            className={cn(
                colorClasses[colorType],
                sizeClasses[sizeType],
                "text-white rounded normal-case",
                className
            )}
        >
            {children}
        </button>
    );
};
