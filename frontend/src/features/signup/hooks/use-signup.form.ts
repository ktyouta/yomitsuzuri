import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignupRequestSchema, SignupRequestType } from "../types/signup-request-type";


export function useSignupForm() {

    return useForm<SignupRequestType>({
        resolver: zodResolver(SignupRequestSchema),
        defaultValues: {
            name: ``,
            birthday: {
                year: ``,
                month: ``,
                day: ``,
            },
            password: ``,
            confirmPassword: ``,
        },
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });
}