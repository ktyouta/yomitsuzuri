export class Cookie {

    private readonly _value: Record<string, string>;

    constructor(cookies: Record<string, string>) {
        this._value = cookies;
    }

    get(key: string): string | undefined {
        return this._value[key];
    }
}
