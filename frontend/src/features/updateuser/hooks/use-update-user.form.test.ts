import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUpdateUserForm } from "./use-update-user.form";

describe("useUpdateUserForm", () => {

    it("loginUserがnullの場合、初期値が空文字であること", () => {
        const { result } = renderHook(() => useUpdateUserForm(null));

        expect(result.current.getValues()).toEqual({
            name: ``,
            birthday: { year: ``, month: ``, day: `` },
        });
    });

    it("loginUserが渡された場合、name・birthdayがその値で初期化されること", () => {
        const { result } = renderHook(() => useUpdateUserForm({
            id: `test-id`,
            name: `TestUser`,
            birthday: `19900515`,
            darkMode: false,
        }));

        expect(result.current.getValues()).toEqual({
            name: `TestUser`,
            birthday: { year: `1990`, month: `05`, day: `15` },
        });
    });

    it("loginUser.birthdayが不正な形式の場合、birthdayは空文字で初期化されること", () => {
        const { result } = renderHook(() => useUpdateUserForm({
            id: `test-id`,
            name: `TestUser`,
            birthday: ``,
            darkMode: false,
        }));

        expect(result.current.getValues()).toEqual({
            name: `TestUser`,
            birthday: { year: ``, month: ``, day: `` },
        });
    });
});
