import { describe, expect, it } from 'vitest';
import { statusBarNotifications } from '../notifications';
import type { BridgeNotification } from '@/types/bridge-fork';

function notification(key: string, packageName: string, postTime: number, extra: Partial<BridgeNotification> = {}): BridgeNotification
{
    return {
        key, packageName, postTime,
        title: null, text: null, subText: null, category: null,
        isOngoing: false, isClearable: true, isGroupSummary: false, hasLargeIcon: false,
        ...extra,
    };
}

describe('statusBarNotifications', () =>
{
    it('keeps only the newest notification of each app, newest first', () =>
    {
        const result = statusBarNotifications([
            notification('a1', 'com.a', 100),
            notification('b1', 'com.b', 200),
            notification('a2', 'com.a', 300),
        ]);
        expect(result.map(n => n.key)).toEqual(['a2', 'b1']);
    });

    it('skips group summaries', () =>
    {
        const result = statusBarNotifications([
            notification('summary', 'com.a', 500, { isGroupSummary: true }),
            notification('child', 'com.a', 400),
        ]);
        expect(result.map(n => n.key)).toEqual(['child']);
    });

    it('shows at most `max` icons', () =>
    {
        const many = Array.from({ length: 10 }, (_, i) => notification(`k${i}`, `com.app${i}`, i));
        expect(statusBarNotifications(many, 4)).toHaveLength(4);
    });
});
