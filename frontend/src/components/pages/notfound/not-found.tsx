import { paths } from "@/config/paths";
import { MdHome, MdReportProblem } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export function NotFound() {

    // ルーティング用
    const navigate = useNavigate();

    return (
        <div className="h-screen flex flex-col justify-center items-center text-center gap-2">
            <MdReportProblem className="text-[72px] text-ink-sub" />
            <h3 className="text-3xl font-bold">
                404
            </h3>
            <p className="text-ink-sub">
                お探しのページは存在しないか、移動しました。
            </p>
            <div className="h-[13%] flex justify-center items-center gap-1 text-accent">
                <MdHome className="text-2xl" />
                <button
                    type="button"
                    onClick={() => {
                        navigate(`${paths.home.path}`);
                    }}
                    className="cursor-pointer underline text-xl hover:opacity-80"
                >
                    ホームに戻る
                </button>
            </div>
        </div>
    );
}
