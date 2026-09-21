import { api } from "@/lib/api-client";
import { AxiosProgressEvent } from "axios";
import { useState } from "react";

// 許可ファイル情報
const FILE_LIMITS = {
    avatar: {
        maxSize: 2 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    document: {
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['application/pdf', 'application/msword'],
    },
    csv: {
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    }
};

type PropsType = {
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
    onSuccess?: (res: unknown) => void,
    onError?: (e: unknown) => void,
    url: string,
}

export function useUploadFile(props: PropsType) {

    // ローディング
    const [isLoading, setIsLoading] = useState(false);

    /**
     * アップロード
     */
    async function upload(fileData: File) {

        setIsLoading(true);

        try {

            const errMessage = checkFile(fileData);

            if (errMessage) {
                throw Error(errMessage);
            }

            const formData = new FormData();
            formData.append("file", fileData);

            const res = await api.post(`${props.url}`, formData, {
                withCredentials: true,
                onUploadProgress: props.onUploadProgress,
            });

            if (props.onSuccess) {
                props.onSuccess(res);
            }

            return res;
        }
        catch (e: unknown) {

            if (props.onError) {
                props.onError(e);
            }

            throw e;
        }
        finally {
            setIsLoading(false);
        }
    }

    return {
        isLoading,
        upload
    }
}

/**
 * アップロード前ファイルチェック
 * @param fileData 
 * @returns 
 */
function checkFile(fileData: File) {

    const targetFileInfoList = Object.values(FILE_LIMITS);

    const targetFileInfo = targetFileInfoList.find((e) => {
        return e.allowedTypes.includes(fileData.type);
    });

    // ファイルタイプの検証
    if (!targetFileInfo) {
        return `許可されていないファイル形式です。`;
    }

    // ファイルサイズの検証
    const maxSize = targetFileInfo.maxSize;

    if (fileData.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        return `ファイルサイズが大きすぎます。上限: ${maxMB}MB`;
    }
}