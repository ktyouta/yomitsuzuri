import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginRequestSchema, LoginRequestType } from "../types/login-request-type";

export function useLoginForm() {

    return useForm<LoginRequestType>({
        resolver: zodResolver(LoginRequestSchema),
        defaultValues: {
            name: ``,
            password: ``,
        },
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });
}