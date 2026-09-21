import { navigationDepth } from "@/stores/navigation-depth-store";
import { useNavigate } from "react-router-dom";

export function useAppNavigation() {

    const navigate = useNavigate();

    /**
     * 次画面遷移
     * @param to 
     */
    function appNavigate(to: string) {
        navigationDepth.increment();
        navigate(to);
    }

    /**
     * 前画面に戻る
     * @param defaultPath 
     */
    function appGoBack(defaultPath: string) {

        if (navigationDepth.canGoBack()) {
            navigationDepth.decrement();
            navigate(-1);
        }
        else {
            navigate(defaultPath);
        }
    }

    return {
        appNavigate,
        appGoBack
    }
}