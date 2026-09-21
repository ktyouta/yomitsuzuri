import { rpc } from '@/lib/rpc-client';
import { useMutation } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';

const endpoint = rpc.api.v1['user-logout'].$post;

type SuccessResponseType = InferResponseType<typeof endpoint, 200>;

type PropsType = {
    onSuccess: (data: SuccessResponseType) => void;
    onError: (message: string) => void;
};

export function useLogoutMutation(props: PropsType) {
    return useMutation({
        mutationFn: async () => {
            const res = await endpoint();
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }
            return res.json();
        },
        onSuccess: (data) => {
            props.onSuccess(data);
        },
        onError: (error: Error) => {
            props.onError(error.message);
        },
    });
}
