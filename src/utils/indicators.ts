import type { SystemNightModeOrError } from "@bridgelauncher/api";
import type { BrightnessStep } from "./brightness";

// The bar under each button of Gingerbread's power control: green = on, amber = in between,
// gray = off, and hidden when the state can't be read
export type Indicator = 'on' | 'mid' | 'off' | 'none';

export function onOffIndicator(on: boolean): Indicator
{
    return on ? 'on' : 'off';
}

export function brightnessIndicator(step: BrightnessStep): Indicator
{
    switch (step)
    {
        case 'auto':
        case 'high': return 'on';
        case 'mid': return 'mid';
        default: return 'off';
    }
}

/** Off without the permission to change it; automatic or custom schedules count as "in between". */
export function nightModeIndicator(mode: SystemNightModeOrError, canRequest: boolean): Indicator
{
    if (!canRequest) return 'off';
    switch (mode)
    {
        case 'yes': return 'on';
        case 'auto':
        case 'custom': return 'mid';
        default: return 'off';
    }
}
