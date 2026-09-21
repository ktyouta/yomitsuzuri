import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./date-picker";

const meta: Meta<typeof DatePicker> = {
    title: "components/ui/date-picker",
    component: DatePicker,
    args: {
        onChange: () => {},
    },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

function Controlled(args: React.ComponentProps<typeof DatePicker>) {
    const [value, setValue] = useState(args.value);
    return (
        <DatePicker
            {...args}
            value={value}
            onChange={(date) => {
                setValue(date);
                args.onChange(date);
            }}
        />
    );
}

export const Default: Story = {
    args: {
        value: null,
    },
    render: (args) => <Controlled {...args} />,
};

export const WithValue: Story = {
    args: {
        value: "2025-12-31",
    },
    render: (args) => <Controlled {...args} />,
};

export const Disabled: Story = {
    args: {
        value: "2025-06-15",
        disabled: true,
    },
};

export const WithPlaceholder: Story = {
    args: {
        value: null,
        placeholder: "日付を選択してください",
    },
    render: (args) => <Controlled {...args} />,
};
