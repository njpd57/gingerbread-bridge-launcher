import { describe, expect, it } from 'vitest';
import { findClockApp } from '../clock';

describe('findClockApp', () =>
{
    it('returns the first known clock package that is installed', () =>
    {
        const installed = new Set(['com.google.android.deskclock', 'com.android.deskclock']);
        expect(findClockApp(p => installed.has(p))).toBe('com.google.android.deskclock');
    });

    it('returns null when none of the known packages are installed', () =>
    {
        expect(findClockApp(() => false)).toBeNull();
    });
});
