import { useUpdateUser } from "../hooks/use-update-user";
import { UpdateUser } from "./update-user";

export function UpdateUserContainer() {

    const props = useUpdateUser();

    return (
        <UpdateUser
            {...props}
        />
    );
}