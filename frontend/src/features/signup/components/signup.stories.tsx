import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { Signup } from './signup';

const meta: Meta<typeof Signup> = {
    title: 'features/signup',
    component: Signup,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof Signup>;

export const Default: Story = {
    render: () => {
        const { register, watch, formState: { errors } } = useForm<{
            name: string;
            birthday: {
                year: string;
                month: string;
                day: string;
            };
            password: string;
            confirmPassword: string;
        }>({
            defaultValues: {
                name: '',
                birthday: { year: '2000', month: '01', day: '01' },
                password: '',
                confirmPassword: '',
            },
        });
        return (
            <Signup
                errMessage=""
                yearCoomboList={[
                    { label: '選択してください', value: '' },
                    { label: '2000', value: '2000' },
                    { label: '1999', value: '1999' },
                    { label: '1998', value: '1998' },
                ]}
                back={() => {
                    alert("戻るボタンが押されました");
                }}
                isLoading={false}
                register={register}
                errors={errors}
                watch={watch}
                handleConfirm={async () => {
                    alert("登録ボタンが押されました");
                }}
            />
        );
    },
};
