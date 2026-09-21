import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Loading } from "../loading";

describe("Loading", () => {
    test("fullScreenを指定しない場合、画面全体サイズのクラスが付与される", () => {
        const { container } = render(<Loading />);

        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass("w-screen");
        expect(root).toHaveClass("h-screen");
    });

    test("fullScreen=falseの場合、画面全体サイズのクラスが付与されない", () => {
        const { container } = render(<Loading fullScreen={false} />);

        const root = container.firstChild as HTMLElement;
        expect(root).not.toHaveClass("w-screen");
        expect(root).not.toHaveClass("h-screen");
    });

    test("fullScreen=falseの場合、classNameで指定した高さがそのまま反映される", () => {
        const { container } = render(<Loading fullScreen={false} className="h-40" />);

        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass("h-40");
        expect(root).not.toHaveClass("h-screen");
    });
});
