import type { Meta, StoryObj } from '@storybook/react';
import { HiOutlineHome } from 'react-icons/hi2';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './dashboard';

const meta: Meta<typeof Dashboard> = {
    title: 'components/layouts/dashboard',
    component: Dashboard,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MemoryRouter>
                <Story />
            </MemoryRouter>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

const navItems = [
    { to: '/mypage', label: 'マイページ', icon: <HiOutlineHome className="h-5 w-5 shrink-0" /> },
];

export const Light: Story = {
    args: {
        loginUser: { id: '1', name: 'テストユーザー', birthday: '19900101', darkMode: false },
        navItems,
        theme: 'light',
        toggleTheme: () => {},
        moveHome: () => {},
        moveUserInfoUpdate: () => {},
        movePasswordUpdate: () => {},
        logout: () => {},
        children: <div className="p-6 text-ink">メインコンテンツ</div>,
    },
};

export const Dark: Story = {
    args: {
        ...Light.args,
        theme: 'dark',
    },
    decorators: [
        (Story) => (
            <div className="dark">
                <Story />
            </div>
        ),
    ],
};
