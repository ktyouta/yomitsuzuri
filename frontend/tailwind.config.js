export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx,stories.tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 汎用デザイントークン。UIコンポーネント側のハードコードされたTailwind標準色
        // （gray-500, blue-500 等）を意味のある名前に置き換えるためのもの。
        // 値自体はCSS変数（--xxx-rgb、index.css の :root / .dark で定義）を参照する。
        // ライト/ダークの切替は <html class="dark"> の付け外しだけで反映される
        // （rgb(var(--x) / <alpha-value>) にすることで bg-accent/50 のような透過度指定にも対応する）。
        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          hover: "rgb(var(--accent-hover-rgb) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          sub: "rgb(var(--ink-sub-rgb) / <alpha-value>)",
        },
        line: "rgb(var(--line-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
      },
      borderColor: {
        // 色指定のない `border` / `border-b` 等（Tailwindの既定では固定のgray-200相当）を
        // line トークンに揃える
        DEFAULT: "rgb(var(--line-rgb) / <alpha-value>)",
      },
      ringColor: {
        DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
      },
    },
  },
  plugins: [],
}

