import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@backend": path.resolve(__dirname, "../backend/src"),
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/testing/setup-tests.ts",
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
