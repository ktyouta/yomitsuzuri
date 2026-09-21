import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./select";

const sampleOptions = [
    { value: "option1", label: "オプション1" },
    { value: "option2", label: "オプション2" },
    { value: "option3", label: "オプション3" },
];

const prefectureOptions = [
    { value: "tokyo", label: "東京都" },
    { value: "osaka", label: "大阪府" },
    { value: "kyoto", label: "京都府" },
    { value: "hokkaido", label: "北海道" },
    { value: "fukuoka", label: "福岡県" },
];

const meta: Meta<typeof Select> = {
    title: "components/ui/select",
    component: Select,
    args: {
        options: sampleOptions,
    },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
    args: {
        placeholder: "選択してください",
        defaultValue: "",
    },
};

export const Prefectures: Story = {
    args: {
        options: prefectureOptions,
        placeholder: "都道府県を選択",
        defaultValue: "",
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        placeholder: "選択できません",
    },
};

export const FullWidth: Story = {
    args: {
        className: "w-full",
        placeholder: "幅いっぱいのセレクト",
    },
};
