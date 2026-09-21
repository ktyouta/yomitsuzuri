
export class Header {

    private readonly _value: Headers;

    constructor(req: Request) {
        if (!req) {
            throw Error(`リクエストが存在しません。`);
        }
        this._value = req.headers;
    }

    get headers() {
        return this._value;
    }

    get(name: string) {

        const value = this._value.get(name.toLowerCase());

        if (Array.isArray(value)) {
            return value[0];
        }

        return value;
    }
}
