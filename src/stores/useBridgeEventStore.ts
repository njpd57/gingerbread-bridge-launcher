import { defineStore } from "pinia";
import type { BridgeEvent } from "@bridgelauncher/api";
import type { BridgeForkEvent } from "@/types/bridge-fork";

// our Bridge fork sends events the upstream types don't know about
export type AnyBridgeEvent = BridgeEvent | BridgeForkEvent;
export type AnyBridgeEventListener = (event: AnyBridgeEvent) => void;

export const useBridgeEventStore = defineStore('bridgeEvent', () =>
{
    const listeners = new Set<AnyBridgeEventListener>();

    function addEventListener(listener: AnyBridgeEventListener)
    {
        listeners.add(listener);
    }

    function removeEventListener(listener: AnyBridgeEventListener)
    {
        listeners.delete(listener);
    }

    window.onBridgeEvent = (event: AnyBridgeEvent) =>
    {
        for (const listener of listeners)
        {
            listener(event);
        }
    };

    return {
        addEventListener,
        removeEventListener,
    };
});
