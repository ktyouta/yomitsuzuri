import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { Login } from './login';

const meta: Meta<typeof Login> = {
    title: 'features/login/login',
    component: Login,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof Login>;

export const Default: Story = {
    render: () => {
        const { register, formState: { errors } } = useForm<{
            name: string;
            password: string;
        }>({
            defaultValues: { name: '', password: '' },
        });
        return (
            <Login
                errMessage=""
                isLoading={false}
                register={register}
                errors={errors}
                clickLogin={async () => {
                    alert("ログインボタンが押されました");
                }}
                navigateSignup={() => {
                    alert("アカウント作成リンクが押されました");
                }}
                handleKeyPress={() => {}}
            />
        );
    },
};
