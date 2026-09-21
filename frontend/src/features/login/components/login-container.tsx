import { Navigate } from 'react-router-dom';
import { useLogin } from '../hooks/use-login';
import { Login } from './login';

export function LoginContainer() {

    const props = useLogin();

    // ログイン済み
    if (props.loginUser) {
        return (
            <Navigate
                to={props.redirectTo}
                replace
            />
        );
    }

    return (
        <Login
            {...props}
        />
    );
}