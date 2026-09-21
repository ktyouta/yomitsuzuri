import { LoadingOverlay, Textbox } from "@/components";
import { BaseSyntheticEvent } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

type PropsType = {
    errMessage: string,
    back: () => void,
    isLoading: boolean,
    register: UseFormRegister<{
        nowPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>,
    errors: FieldErrors<{
        nowPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>,
    handleConfirm: (e?: BaseSyntheticEvent<object, any, any> | undefined) => Promise<void>
}

export function UpdatePassword(props: PropsType) {

    const {
        errMessage,
        back,
        isLoading,
        register,
        errors,
        handleConfirm
    } = { ...props };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
            {isLoading && <LoadingOverlay />}
            <div className="w-full max-w-lg bg-surface rounded-xl shadow-lg p-8 sm:p-10">
                <h1 className="text-2xl font-bold text-accent text-center mb-8">
                    パスワード変更
                </h1>
                {errMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-4 mb-6">
                        {errMessage}
                    </div>
                )}
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">
                            現在のパスワード
                        </label>
                        <Textbox
                            className={`w-full h-12 px-4 rounded-lg ${errors.nowPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                            type="password"
                            autoComplete="off"
                            registration={register("nowPassword")}
                        />
                        {errors.nowPassword?.message && (
                            <p className="text-red-500 text-xs mt-2">{errors.nowPassword.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">
                            新しいパスワード
                        </label>
                        <Textbox
                            className={`w-full h-12 px-4 rounded-lg ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                            type="password"
                            autoComplete="off"
                            registration={register("newPassword")}
                        />
                        {errors.newPassword?.message && (
                            <p className="text-red-500 text-xs mt-2">{errors.newPassword.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink mb-2">
                            確認用パスワード
                        </label>
                        <Textbox
                            className={`w-full h-12 px-4 rounded-lg ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                            type="password"
                            autoComplete="off"
                            registration={register("confirmPassword")}
                        />
                        {errors.confirmPassword?.message && (
                            <p className="text-red-500 text-xs mt-2">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                    <div className="flex flex-row gap-3 mt-4">
                        <button
                            type="button"
                            className="flex-1 border-2 border-accent/30 bg-surface hover:bg-canvas text-ink-sub font-medium py-3 px-4 rounded-lg transition-colors"
                            onClick={back}
                        >
                            戻る
                        </button>
                        <button
                            type="button"
                            className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            onClick={handleConfirm}
                        >
                            変更
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
