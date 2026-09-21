import { Button } from '@/components';
import reactLogo from '../../../assets/react.svg';
import viteLogo from '/vite.svg';

type Props = {
    count: number,
    click: () => void,
    healthStatus: string | null,
    healthTimestamp: string | null,
    isHealthLoading: boolean,
    isHealthError: boolean,
    refetchHealth: () => void,
}

export const Home = (props: Props) => {

    return (
        <div className='flex flex-col w-full h-full items-center justify-center'>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img
                        src={viteLogo}
                        className="h-[6em] p-[1.5em] transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
                        alt="Vite logo"
                    />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img
                        src={reactLogo}
                        className="h-[6em] p-[1.5em] transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] motion-safe:animate-[spin_20s_linear_infinite]"
                        alt="React logo"
                    />
                </a>
            </div>
            <h1>Vite + React Header message</h1>
            <h1 className="text-2xl font-bold mb-4">React + Hono RPC Template</h1>
            <div className="p-8">
                <Button colorType="blue" sizeType="large" className="px-4 py-2" onClick={props.click}>
                    count is {props.count}
                </Button>

                {/* RPC Health Check サンプル */}
                <div className="mt-8 p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">RPC Health Check</h2>
                    {props.isHealthLoading && (
                        <p className="text-ink-sub">Loading...</p>
                    )}
                    {props.isHealthError && (
                        <p className="text-red-500">Error: Failed to fetch health status</p>
                    )}
                    {props.healthStatus && (
                        <div className="space-y-1">
                            <p>Status: <span className="text-green-600 font-medium">{props.healthStatus}</span></p>
                            <p className="text-sm text-ink-sub">Timestamp: {props.healthTimestamp}</p>
                        </div>
                    )}
                    <Button colorType="blue" sizeType="small" className="text-sm" onClick={props.refetchHealth}>
                        Refresh
                    </Button>
                </div>
            </div>
            <p className="text-ink-sub">
                Click on the Vite and React logos to learn more footer message
            </p>
        </div>
    )
};
