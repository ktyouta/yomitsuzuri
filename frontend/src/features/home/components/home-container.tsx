import { useHome } from "../hooks/use-home";
import { Home } from "./home";

export const HomeContainer = () => {

    const props = useHome();

    return (
        <Home
            {...props}
        />
    );
};
