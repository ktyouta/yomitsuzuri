import { NotFound } from '@/components';
import { NotFoundError } from '@/lib/errors';
import { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';

type PropsType = {
    children: ReactNode;
};

export function AppErrorBoundary(props: PropsType) {

    const location = useLocation();

    return (
        <ErrorBoundary
            resetKeys={[location.pathname]}
            fallbackRender={({ error }) => {
                if (error instanceof NotFoundError) {
                    return <NotFound />;
                }
                throw error;
            }}
        >
            {props.children}
        </ErrorBoundary>
    );
}
