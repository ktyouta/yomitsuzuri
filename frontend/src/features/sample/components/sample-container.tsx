import { useSample } from "../hooks/use-sample";
import { Sample } from "./sample";

export const SampleContainer = () => {

    const props = useSample();

    return (
        <Sample
            {...props}
        />
    );
};
