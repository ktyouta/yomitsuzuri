import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from 'react-error-boundary';
import { MemoryRouter } from 'react-router-dom';
import { Errors } from './errors';

const meta: Meta<typeof Errors> = {
    title: 'components/pages/errors',
    component: Errors,
    decorators: [
        (Story) => (
            <MemoryRouter>
                <ErrorBoundary
                    fallback={<div>Fallback</div>}
                >
                    <Story />
                </ErrorBoundary>
            </MemoryRouter>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof Errors>;

export const Default: Story = {};
