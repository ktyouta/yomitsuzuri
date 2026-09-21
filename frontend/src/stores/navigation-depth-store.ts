let navDepth = 0;

export const navigationDepth = {
    increment: () => {
        navDepth++
    },
    decrement: () => {
        navDepth = Math.max(0, navDepth - 1);
    },
    canGoBack: () => {
        return navDepth > 0;
    },
};