import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Drawer } from "./drawer";

const meta: Meta<typeof Drawer> = {
    title: "components/ui/drawer",
    component: Drawer,
    args: {
        isOpen: false,
        title: "ドロワータイトル",
        description: "ドロワーの説明文",
        side: "right",
        closeOnOverlayClick: true,
        closeOnEscape: true,
    },
};

export default meta;

type Story = StoryObj<typeof Drawer>;

// インタラクティブなストーリー用のラッパー
function DrawerWithButton(props: React.ComponentProps<typeof Drawer>) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                ドロワーを開く
            </button>
            <Drawer {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                {props.children}
            </Drawer>
        </>
    );
}

export const Default: Story = {
    render: (args) => (
        <DrawerWithButton {...args}>
            <p>ドロワーの内容がここに表示されます。</p>
        </DrawerWithButton>
    ),
};

export const Right: Story = {
    render: (args) => (
        <DrawerWithButton {...args} side="right" title="右側ドロワー">
            <p>右側から表示されるドロワーです。</p>
            <p className="mt-2">デフォルトの表示位置です。</p>
        </DrawerWithButton>
    ),
};

export const Left: Story = {
    render: (args) => (
        <DrawerWithButton {...args} side="left" title="左側ドロワー">
            <p>左側から表示されるドロワーです。</p>
            <p className="mt-2">サイドメニューなどに使用できます。</p>
        </DrawerWithButton>
    ),
};

export const Top: Story = {
    render: (args) => (
        <DrawerWithButton {...args} side="top" title="上部ドロワー">
            <p>上から表示されるドロワーです。</p>
            <p className="mt-2">通知やアラートの表示に使用できます。</p>
        </DrawerWithButton>
    ),
};

export const Bottom: Story = {
    render: (args) => (
        <DrawerWithButton {...args} side="bottom" title="下部ドロワー">
            <p>下から表示されるドロワーです。</p>
            <p className="mt-2">モバイルでのアクションシートに使用できます。</p>
        </DrawerWithButton>
    ),
};

export const WithoutTitle: Story = {
    render: (args) => (
        <DrawerWithButton {...args} title={undefined} description={undefined}>
            <p>タイトルなしのドロワーです。</p>
            <p className="mt-2">ヘッダー部分が表示されません。</p>
        </DrawerWithButton>
    ),
};

export const NavigationMenu: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    メニュー
                </button>
                <Drawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="ナビゲーション"
                    side="left"
                >
                    <nav className="flex flex-col space-y-2">
                        <a
                            href="#"
                            className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            ホーム
                        </a>
                        <a
                            href="#"
                            className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            プロフィール
                        </a>
                        <a
                            href="#"
                            className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            設定
                        </a>
                        <a
                            href="#"
                            className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            ヘルプ
                        </a>
                    </nav>
                    <div className="mt-8 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full px-4 py-2 text-red-500 border border-red-500 rounded hover:bg-red-50"
                        >
                            ログアウト
                        </button>
                    </div>
                </Drawer>
            </>
        );
    },
};

export const FormDrawer: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    新規作成
                </button>
                <Drawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="新規ユーザー作成"
                    description="ユーザー情報を入力してください。"
                >
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                名前
                            </label>
                            <input
                                type="text"
                                className="w-full h-9 border border-gray-300 rounded px-3"
                                placeholder="名前を入力"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                className="w-full h-9 border border-gray-300 rounded px-3"
                                placeholder="example@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                役職
                            </label>
                            <select className="w-full h-9 border border-gray-300 rounded px-3">
                                <option value="">選択してください</option>
                                <option value="admin">管理者</option>
                                <option value="member">メンバー</option>
                                <option value="guest">ゲスト</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                作成
                            </button>
                        </div>
                    </form>
                </Drawer>
            </>
        );
    },
};

export const DetailDrawer: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    詳細を見る
                </button>
                <Drawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="ユーザー詳細"
                    description="ユーザーID: 12345"
                >
                    <div className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">名前</dt>
                            <dd className="mt-1 text-sm text-gray-900">山田 太郎</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                            <dd className="mt-1 text-sm text-gray-900">yamada@example.com</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">役職</dt>
                            <dd className="mt-1 text-sm text-gray-900">管理者</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">登録日</dt>
                            <dd className="mt-1 text-sm text-gray-900">2024年1月1日</dd>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button
                            type="button"
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            編集
                        </button>
                        <button
                            type="button"
                            className="flex-1 px-4 py-2 text-red-500 border border-red-500 rounded hover:bg-red-50"
                        >
                            削除
                        </button>
                    </div>
                </Drawer>
            </>
        );
    },
};
