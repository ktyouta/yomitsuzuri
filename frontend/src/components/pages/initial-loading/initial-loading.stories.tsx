import type { Meta, StoryObj } from '@storybook/react';
import { InitialLoading } from './initial-loading';

const meta: Meta<typeof InitialLoading> = {
    title: 'components/pages/initial-loading',
    component: InitialLoading,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

type Story = StoryObj<typeof InitialLoading>;

export const Default: Story = {};
