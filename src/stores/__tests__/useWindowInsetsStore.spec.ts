import { describe, expect, it } from 'vitest';
import { toInsets } from '../useWindowInsetsStore';

describe('toInsets', () =>
{
    it('parses the JSON strings returned by Bridge getters', () =>
    {
        expect(toInsets('{"left":0,"top":42,"right":0,"bottom":16}')).toEqual({ left: 0, top: 42, right: 0, bottom: 16 });
    });

    it('accepts already-parsed objects from Bridge events', () =>
    {
        expect(toInsets({ left: 1, top: 2, right: 3, bottom: 4 })).toEqual({ left: 1, top: 2, right: 3, bottom: 4 });
    });

    it('turns missing, invalid or negative values into zeros', () =>
    {
        const zero = { left: 0, top: 0, right: 0, bottom: 0 };
        expect(toInsets('not json')).toEqual(zero);
        expect(toInsets(null)).toEqual(zero);
        expect(toInsets({ top: 'x', bottom: -5 })).toEqual(zero);
    });
});
