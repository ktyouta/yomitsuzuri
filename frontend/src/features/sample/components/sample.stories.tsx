import type { Meta, StoryObj } from '@storybook/react'
import { Sample } from './sample'

const meta: Meta<typeof Sample> = {
    title: 'features/sample/sample',
    component: Sample,
}

export default meta
type Story = StoryObj<typeof Sample>

export const Default: Story = {
    args: {
        count: 0,
        click: () => {},
    },
}
