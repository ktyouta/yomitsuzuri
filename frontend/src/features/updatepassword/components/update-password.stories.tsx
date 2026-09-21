import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { UpdatePassword } from './update-password';

const meta: Meta<typeof UpdatePassword> = {
    title: 'features/updatepassword',
    component: UpdatePassword,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof UpdatePassword>;

export const Default: Story = {
    render: () => {
        const { register, formState: { errors } } = useForm<{
            nowPassword: string;
            newPassword: string;
            confirmPassword: string;
        }>({
            defaultValues: { nowPassword: '', newPassword: '', confirmPassword: '' },
        });
        return (
            <UpdatePassword
                errMessage=""
                back={() => {
                    alert("戻るボタンが押されました");
                }}
                isLoading={false}
                register={register}
                errors={errors}
                handleConfirm={async () => {
                    alert("登録ボタンが押されました");
                }}
            />
        );
    },
};
