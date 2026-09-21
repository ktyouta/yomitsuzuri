import { cn } from "@/utils/cn";
import * as React from "react";
import { type ComponentPropsWithoutRef } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

type Props = {
    registration?: Partial<UseFormRegisterReturn>;
} & Omit<ComponentPropsWithoutRef<"input">, "ref">;

export const Textbox = React.forwardRef<HTMLInputElement, Props>(
    ({ registration, className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                {...registration}
                {...props}
                className={cn(
                    "h-9 border border-line rounded px-1.5 text-base bg-surface text-ink",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                    className
                )}
            />
        );
    }
);
