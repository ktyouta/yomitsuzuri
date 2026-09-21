import { Button } from '@/components';
import reactLogo from '../../../assets/react.svg';
import viteLogo from '/vite.svg';

type Props = {
    count: number,
    click: () => void,
}

export const Sample = (props: Props) => {

    return (
        <div>
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
            <div className="p-8">
                <Button colorType="blue" sizeType="large" className="px-4 py-2" onClick={props.click}>
                    count is {props.count}
                </Button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className="text-[#888]">
                Click on the Vite and React logos to learn more footer message
            </p>
        </div>
    )
};
