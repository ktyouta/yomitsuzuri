import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
    title: "components/ui/textarea",
    component: Textarea,
    args: {
        placeholder: "テキストを入力してください",
    },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithRows: Story = {
    args: {
        rows: 5,
        placeholder: "5行のテキストエリア",
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        placeholder: "無効なテキストエリア",
    },
};

export const WithValue: Story = {
    args: {
        defaultValue: "初期値が設定されています。\n複数行のテキストを入力できます。",
    },
};

export const FullWidth: Story = {
    args: {
        className: "w-full",
        placeholder: "幅いっぱいのテキストエリア",
    },
};
