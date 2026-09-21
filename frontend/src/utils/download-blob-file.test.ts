import { afterEach, describe, expect, test, vi } from 'vitest';
import { downloadBlobFile } from './download-blob-file';

describe('downloadBlobFile', () => {

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    test('指定したファイル名のaタグをクリックしてダウンロードし、後始末する', () => {

        const createObjectURL = vi.fn().mockReturnValue('blob:test-url');
        const revokeObjectURL = vi.fn();
        vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
        const blob = new Blob(['a,b'], { type: 'text/csv' });

        downloadBlobFile('export.csv', blob);

        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        const anchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
        expect(anchor.download).toBe('export.csv');
        expect(anchor.href).toBe('blob:test-url');
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
        // aタグはDOMに残らない
        expect(document.body.contains(anchor)).toBe(false);
    });
});
