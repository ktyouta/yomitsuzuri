import type { Meta, StoryObj } from '@storybook/react';

import { Table, TableProps } from './table';

type User = {
  id: string;
  createdAt: number;
  name: string;
  email: string;
  role: string;
};

const sampleUsers: User[] = [
  {
    id: '1',
    createdAt: 1706140800000,
    name: '山田 太郎',
    email: 'yamada@example.com',
    role: '管理者',
  },
  {
    id: '2',
    createdAt: 1706227200000,
    name: '佐藤 花子',
    email: 'sato@example.com',
    role: '編集者',
  },
  {
    id: '3',
    createdAt: 1706313600000,
    name: '鈴木 一郎',
    email: 'suzuki@example.com',
    role: '閲覧者',
  },
  {
    id: '4',
    createdAt: 1706400000000,
    name: '田中 美咲',
    email: 'tanaka@example.com',
    role: '編集者',
  },
];

const columns: TableProps<User>['columns'] = [
  { title: '名前', field: 'name' },
  { title: 'メールアドレス', field: 'email' },
  { title: '権限', field: 'role' },
];

const columnsWithCustomCell: TableProps<User>['columns'] = [
  { title: '名前', field: 'name' },
  { title: 'メールアドレス', field: 'email' },
  {
    title: '権限',
    field: 'role',
    Cell: ({ entry }) => (
      <span
        className={
          entry.role === '管理者'
            ? 'rounded bg-red-100 px-2 py-1 text-red-800'
            : entry.role === '編集者'
              ? 'rounded bg-blue-100 px-2 py-1 text-blue-800'
              : 'rounded bg-gray-100 px-2 py-1 text-gray-800'
        }
      >
        {entry.role}
      </span>
    ),
  },
  {
    title: '登録日',
    field: 'createdAt',
    Cell: ({ entry }) => (
      <span>{new Date(entry.createdAt).toLocaleDateString('ja-JP')}</span>
    ),
  },
];

const meta: Meta<TableProps<User>> = {
  title: 'components/ui/table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<TableProps<User>>;

export const Default: Story = {
  args: {
    data: sampleUsers,
    columns: columns,
  },
};

export const WithCustomCell: Story = {
  args: {
    data: sampleUsers,
    columns: columnsWithCustomCell,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: columns,
  },
};
