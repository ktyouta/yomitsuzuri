import { useUpdatePassword } from "../hooks/use-update-password";
import { UpdatePassword } from "./update-password";

export function UpdatePasswordContainer() {

    const props = useUpdatePassword();

    return (
        <UpdatePassword
            {...props}
        />
    );
}