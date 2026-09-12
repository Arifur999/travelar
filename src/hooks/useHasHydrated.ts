"use client";

import { useSyncExternalStore } from "react";

// Never fires — the value is constant per environment, so there is nothing to
// subscribe to. Defined at module scope so the reference is stable across
// renders and useSyncExternalStore does not resubscribe.
const emptySubscribe = () => () => {};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True once the client has hydrated, false during SSR and on the first paint.
 *
 * This is the hydration check without the usual `useState` +
 * `useEffect(() => setMounted(true))` pair. That pair triggers a second render
 * pass on every mount and is exactly what `react-hooks/set-state-in-effect`
 * flags; useSyncExternalStore gives React the two snapshots directly, so
 * there is no state to commit and no cascading render.
 *
 * Use it to gate anything whose server and client markup would otherwise
 * differ on the first frame.
 */
export const useHasHydrated = () =>
  useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
