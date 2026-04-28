/**
 * useLiveGame — subscribes to the backend's per-game SSE stream.
 *
 *  GET /api/v1/games/{id}/stream emits two event types:
 *    - `event: tick`      — payload is a LiveGameTick (see types.ts)
 *    - `event: heartbeat` — empty 15s keepalive, ignored client-side
 *
 *  Lifecycle rules (mirrors backend `broker.py`):
 *    - Open EventSource on mount when `enabled` is true.
 *    - Reconnect on transient error with exponential backoff: 1s → 30s.
 *    - Close cleanly on unmount.
 *    - Close cleanly when the backend signals `tick.is_final === true`.
 *    - On `document.visibilitychange`:
 *        hidden  → close, status = "closed"
 *        visible → reopen, status = "connecting" → "live" on first tick
 *      This is critical for mobile Safari, which freezes the connection
 *      in the background and won't fire any events when foregrounded again
 *      until the underlying socket times out.
 *
 *  Returns:
 *    - tick: last received LiveGameTick (or null pre-first-message)
 *    - status: connection state — "connecting" | "live" | "closed" | "error"
 *    - lastUpdate: Date of the most recent tick we received
 *
 *  Note: server components can't use this. Always called from `"use client"`.
 */
"use client";

import * as React from "react";

import { LiveGameTick } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "";

export type LiveStatus = "connecting" | "live" | "closed" | "error";

export interface UseLiveGameResult {
  tick: LiveGameTick | null;
  status: LiveStatus;
  lastUpdate: Date | null;
}

interface UseLiveGameOptions {
  /** When false, the hook holds off on opening the EventSource entirely. */
  enabled?: boolean;
  /** Initial backoff in ms. Doubles each retry, capped at `maxBackoffMs`. */
  initialBackoffMs?: number;
  /** Cap on the backoff between retries. */
  maxBackoffMs?: number;
}

const DEFAULT_INITIAL_BACKOFF = 1_000;
const DEFAULT_MAX_BACKOFF = 30_000;

export function useLiveGame(
  gameId: number | null | undefined,
  opts: UseLiveGameOptions = {},
): UseLiveGameResult {
  const {
    enabled = true,
    initialBackoffMs = DEFAULT_INITIAL_BACKOFF,
    maxBackoffMs = DEFAULT_MAX_BACKOFF,
  } = opts;

  const [tick, setTick] = React.useState<LiveGameTick | null>(null);
  const [status, setStatus] = React.useState<LiveStatus>("closed");
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  // Refs that survive remounts. We keep the EventSource and the retry
  // timer on refs so the cleanup function can tear them down regardless
  // of which render scheduled them.
  const sourceRef = React.useRef<EventSource | null>(null);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const backoffRef = React.useRef<number>(initialBackoffMs);
  const finalRef = React.useRef<boolean>(false);
  const hiddenRef = React.useRef<boolean>(false);

  // Shouldn't be possible to construct the URL on the server, but guard
  // anyway so we never accidentally evaluate `EventSource` in SSR.
  const url = React.useMemo(() => {
    if (!gameId || !Number.isFinite(gameId)) return null;
    if (!BASE) return null;
    return `${BASE.replace(/\/+$/, "")}/api/v1/games/${gameId}/stream`;
  }, [gameId]);

  // Stable open/close. Both are idempotent — calling open() while one is
  // already open is a no-op, calling close() with nothing open is a no-op.
  const close = React.useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  const open = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (!url) return;
    if (sourceRef.current) return; // Already open.
    if (finalRef.current) return; // Stream told us it was over.
    if (hiddenRef.current) return; // Tab hidden — wait for visibility.

    setStatus("connecting");

    let es: EventSource;
    try {
      es = new EventSource(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[useLiveGame] EventSource constructor threw:", err);
      setStatus("error");
      return;
    }

    sourceRef.current = es;

    // Backend explicitly emits `event: tick`. Don't listen on `onmessage`
    // (which only catches *unnamed* events) or we'll drop everything.
    es.addEventListener("tick", (event) => {
      const me = event as MessageEvent<string>;
      try {
        const json = JSON.parse(me.data);
        const parsed = LiveGameTick.safeParse(json);
        if (!parsed.success) {
          // eslint-disable-next-line no-console
          console.warn(
            "[useLiveGame] tick failed schema validation",
            parsed.error.format(),
          );
          return;
        }
        // First valid tick → we're "live" and we reset the backoff so any
        // future hiccup starts from 1s again.
        backoffRef.current = initialBackoffMs;
        setTick(parsed.data);
        setLastUpdate(new Date());
        setStatus("live");

        // Backend sends one final tick with is_final=true and then closes
        // its end. We mirror by tearing down so React Query / parent state
        // doesn't keep waiting on a dead socket.
        if (parsed.data.is_final) {
          finalRef.current = true;
          close();
          setStatus("closed");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[useLiveGame] failed to parse tick payload", err);
      }
    });

    // Heartbeats arrive every 15s. We don't update tick state on them,
    // but receiving one resets the backoff because it confirms the
    // connection is healthy.
    es.addEventListener("heartbeat", () => {
      backoffRef.current = initialBackoffMs;
    });

    es.onerror = () => {
      // EventSource will auto-reconnect on its own *unless* we close it.
      // We close so the browser's built-in retry doesn't fight our
      // exponential backoff. The retry below is what actually reopens.
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      // If the backend deliberately closed the stream after a Final tick,
      // don't reconnect.
      if (finalRef.current) {
        setStatus("closed");
        return;
      }
      setStatus("error");
      const delay = Math.min(backoffRef.current, maxBackoffMs);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        backoffRef.current = Math.min(backoffRef.current * 2, maxBackoffMs);
        open();
      }, delay);
    };
  }, [url, close, initialBackoffMs, maxBackoffMs]);

  // Lifecycle: open on mount / when enabled flips on, close on unmount.
  React.useEffect(() => {
    if (!enabled || !url) {
      close();
      setStatus("closed");
      return;
    }
    // Reset terminal state when the gameId or enabled flag changes.
    finalRef.current = false;
    backoffRef.current = initialBackoffMs;
    open();
    return () => {
      close();
    };
    // `open` and `close` are stable via useCallback deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]);

  // Visibility hygiene: pause while backgrounded, resume on focus. This
  // matters most for mobile Safari, which keeps the TCP connection
  // technically alive but won't fire events until the user returns.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (!enabled) return;

    const onVisibilityChange = () => {
      const isHidden = document.visibilityState === "hidden";
      hiddenRef.current = isHidden;
      if (isHidden) {
        close();
        setStatus("closed");
      } else if (!finalRef.current && url) {
        // Reset backoff so a long-backgrounded tab reconnects quickly.
        backoffRef.current = initialBackoffMs;
        open();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]);

  // Reset tick state when the gameId changes — otherwise a stale tick
  // from a previous game could flash on screen for one render.
  React.useEffect(() => {
    setTick(null);
    setLastUpdate(null);
    finalRef.current = false;
  }, [url]);

  return { tick, status, lastUpdate };
}
