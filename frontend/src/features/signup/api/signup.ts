import { rpc } from '@/lib/rpc-client';
import { useMutation } from '@tanstack/react-query';
import type { InferResponseType, InferRequestType } from 'hono/client';

const endpoint = rpc.api.v1.user.$post;

type SuccessResponseType = InferResponseType<typeof endpoint, 201>;
type RequestType = InferRequestType<typeof endpoint>['json'];

type PropsType = {
    onSuccess: (data: SuccessResponseType) => void;
    onError: (message: string) => void;
};

export function useSignupMutation(props: PropsType) {
    return useMutation({
        mutationFn: async (data: RequestType) => {
            const res = await endpoint({ json: data });
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