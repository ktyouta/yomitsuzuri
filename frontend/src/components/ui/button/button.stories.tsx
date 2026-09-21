import type { Meta, StoryObj } from "@storybook/react";
import { Button, type PropsType } from "./button";

const meta: Meta<PropsType> = {
    title: "components/ui/button",
    component: Button,
    tags: ["autodocs"],
    argTypes: {
        colorType: {
            control: "select",
            options: ["red", "blue", "green"],
        },
        sizeType: {
            control: "select",
            options: ["small", "medium", "large"],
        },
        onClick: { action: "clicked" },
    },
};

export default meta;
type Story = StoryObj<PropsType>;

export const Red: Story = {
    args: {
        colorType: "red",
        sizeType: "medium",
        children: "赤ボタン",
    },
};

export const Blue: Story = {
    args: {
        colorType: "blue",
        sizeType: "medium",
        children: "青ボタン",
    },
};

export const Green: Story = {
    args: {
        colorType: "green",
        sizeType: "medium",
        children: "緑ボタン",
    },
};

export const Large: Story = {
    args: {
        colorType: "blue",
        sizeType: "large",
        children: "大きいボタン",
    },
};

export const Small: Story = {
    args: {
        colorType: "red",
        sizeType: "small",
        children: "小さいボタン",
    },
};

export const Custom: Story = {
    args: {
        colorType: "green",
        sizeType: "small",
        children: "ボタン(カスタム)",
        className: "py-[15px] px-[30px]"
    },
};