import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UpdatePasswordRequestSchema, UpdatePasswordRequestType } from "../types/update-password-request-type";


export function useUpdatePasswordForm() {

    return useForm<UpdatePasswordRequestType>({
        resolver: zodResolver(UpdatePasswordRequestSchema),
        defaultValues: {
            nowPassword: ``,
            newPassword: ``,
            confirmPassword: ``,
        },
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });
}