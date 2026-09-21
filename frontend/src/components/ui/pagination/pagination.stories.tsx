import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Pagination } from "./pagination";

const meta: Meta<typeof Pagination> = {
    title: "components/ui/pagination",
    component: Pagination,
    tags: ["autodocs"],
    argTypes: {
        onPageChange: { action: "pageChanged" },
    },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// ページ操作が可能なインタラクティブストーリー
export const Interactive: Story = {
    render: () => {
        const [page, setPage] = useState(1);
        return (
            <Pagination
                currentPage={page}
                totalPages={10}
                onPageChange={setPage}
            />
        );
    },
};

// 先頭ページ（前へボタンが disabled）
export const FirstPage: Story = {
    args: {
        currentPage: 1,
        totalPages: 10,
    },
};

// 末尾ページ（次へボタンが disabled）
export const LastPage: Story = {
    args: {
        currentPage: 10,
        totalPages: 10,
    },
};

// 中間ページ（両側に省略あり）
export const MiddlePage: Story = {
    args: {
        currentPage: 5,
        totalPages: 10,
    },
};

// 総ページ数が7以下（省略なし）
export const FewPages: Story = {
    args: {
        currentPage: 3,
        totalPages: 5,
    },
};
