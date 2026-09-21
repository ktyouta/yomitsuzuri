import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './not-found';

const meta: Meta<typeof NotFound> = {
    title: 'components/pages/notfound',
    component: NotFound,
    decorators: [
        (Story) => (
            <MemoryRouter>
                <Story />
            </MemoryRouter>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof NotFound>;

export const Default: Story = {};
