import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dialog } from "./dialog";

const meta: Meta<typeof Dialog> = {
    title: "components/ui/dialog",
    component: Dialog,
    args: {
        isOpen: false,
        title: "ダイアログタイトル",
        size: "medium",
        closeOnOverlayClick: true,
        closeOnEscape: true,
    },
};

export default meta;

type Story = StoryObj<typeof Dialog>;

// インタラクティブなストーリー用のラッパー
function DialogWithButton(props: React.ComponentProps<typeof Dialog>) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                ダイアログを開く
            </button>
            <Dialog {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                {props.children}
            </Dialog>
        </>
    );
}

export const Default: Story = {
    render: (args) => (
        <DialogWithButton {...args}>
            <p>ダイアログの内容がここに表示されます。</p>
        </DialogWithButton>
    ),
};

export const Small: Story = {
    render: (args) => (
        <DialogWithButton {...args} size="small" title="小さいダイアログ">
            <p>小さいサイズのダイアログです。</p>
        </DialogWithButton>
    ),
};

export const Large: Story = {
    render: (args) => (
        <DialogWithButton {...args} size="large" title="大きいダイアログ">
            <p>大きいサイズのダイアログです。</p>
            <p className="mt-2">より多くのコンテンツを表示できます。</p>
        </DialogWithButton>
    ),
};

export const WithoutTitle: Story = {
    render: (args) => (
        <DialogWithButton {...args} title={undefined}>
            <p>タイトルなしのダイアログです。</p>
            <p className="mt-2">閉じるボタンは表示されません。</p>
        </DialogWithButton>
    ),
};

export const ConfirmDialog: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    削除する
                </button>
                <Dialog
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="確認"
                    size="small"
                >
                    <p className="text-gray-600">本当に削除しますか？</p>
                    <div className="flex justify-end gap-2 mt-4">
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
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            削除
                        </button>
                    </div>
                </Dialog>
            </>
        );
    },
};

export const FormDialog: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    フォームを開く
                </button>
                <Dialog
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="ユーザー情報"
                    size="medium"
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
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsOpen(false);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                保存
                            </button>
                        </div>
                    </form>
                </Dialog>
            </>
        );
    },
};
