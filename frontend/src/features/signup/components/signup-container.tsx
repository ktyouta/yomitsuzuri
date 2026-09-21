import { useSignup } from "../hooks/use-signup";
import { Signup } from "./signup";

export function SignupContainer() {

    const props = useSignup();

    return (
        <Signup
            {...props}
        />
    );
}