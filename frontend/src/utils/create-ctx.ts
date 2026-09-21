import { createContext, Provider, useContext } from "react";

export function createCtx<T>(): {
    useCtx: () => T,
    Provider: Provider<T>
} {
    const context = createContext<T | undefined>(undefined);

    function useCtx(): T {
        const value = useContext(context);
        if (value === undefined) {
            throw new Error("useCtx must be used within a Provider");
        }
        return value;
    }

    return {
        useCtx,
        Provider: context.Provider as Provider<T>
    }
}