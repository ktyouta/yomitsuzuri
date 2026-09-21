import { useEffect } from 'react';
import { Spinner } from '../spinner/spinner';

export function LoadingOverlay() {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <Spinner className="size-8 sm:size-12" />
        </div>
    );
}
