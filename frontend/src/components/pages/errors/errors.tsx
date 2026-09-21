import { paths } from '@/config/paths';
import { useErrorBoundary } from 'react-error-boundary';
import { MdErrorOutline, MdHome } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export function Errors() {

    // ルーティング用
    const navigate = useNavigate();
    // ErrorBoundaryリセット用
    const { resetBoundary } = useErrorBoundary();

    return (
        <div className="w-full h-screen p-2 box-border text-center">
            <div className="h-[87%] flex items-center justify-center">
                <div className="flex flex-col gap-2 items-center">
                    <MdErrorOutline className="text-[40px] text-danger" />
                    <h5 className="text-xl font-bold">
                        エラーが発生しました
                    </h5>
                    <p>
                        ホームに戻るか、時間をおいて再試行してください。
                    </p>
                </div>
            </div>
            <div className="h-[13%] flex justify-center items-center gap-1 text-accent">
                <MdHome className="text-2xl mr-1" />
                <span
                    onClick={() => {
                        resetBoundary();
                        navigate(`${paths.home.path}`);
                    }}
                    className="cursor-pointer underline text-xl hover:opacity-80"
                >
                    ホームに戻る
                </span>
            </div>
        </div>
    );
}
