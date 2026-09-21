import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Checkbox> = {
    title: 'components/ui/checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    argTypes: {
        checked: {
            control: 'boolean',
            description: 'チェック状態',
        },
        disabled: {
            control: 'boolean',
            description: '非活性',
        },
        size: {
            control: 'radio',
            options: ['small', 'medium', 'large'],
            description: 'チェックボックスのサイズ',
        },
    },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

const StatefulWrapper = (args: any) => {
    const [checked, setChecked] = useState(args.checked);

    return (
        <Checkbox
            {...args}
            checked={checked}
            onChange={(v) => setChecked(v)}
        />
    );
};

export const Default: Story = {
    render: (args) => <StatefulWrapper {...args} />,
    args: {
        checked: false,
        disabled: false,
        size: 'medium',
    },
};

export const Disabled: Story = {
    render: (args) => <StatefulWrapper {...args} />,
    args: {
        checked: true,
        disabled: true,
        size: 'medium',
    },
};

export const Small: Story = {
    render: (args) => <StatefulWrapper {...args} />,
    args: {
        checked: false,
        size: 'small',
    },
};

export const Large: Story = {
    render: (args) => <StatefulWrapper {...args} />,
    args: {
        checked: true,
        size: 'large',
    },
};
