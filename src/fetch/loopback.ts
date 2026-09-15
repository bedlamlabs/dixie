/**
 * Browser-style `localhost` resolution for Dixie's outbound fetches.
 *
 * Browsers never ask the OS resolver about `localhost` or `*.localhost` —
 * they map those names straight to loopback (WHATWG URL / RFC 6761). Node's
 * fetch does ask, via getaddrinfo, and on some hosts that lookup is slow:
 * macOS with no `::1 localhost` line in /etc/hosts spends ~5s per lookup
 * waiting on mDNS for the AAAA record. getaddrinfo runs on libuv's
 * four-thread pool, so a Vite SPA that imports a dozen chunks queues the
 * lookups behind each other until undici's 10s connect timeout fires and
 * every chunk fails with a bare "fetch failed".
 *
 * `dixieFetch` gives loopback hosts a dispatcher whose lookup answers from
 * memory with both 127.0.0.1 and ::1, letting Node's happy-eyeballs connect
 * pick whichever family the server is listening on. Every other host goes
 * through fetch untouched.
 */

import { Agent } from 'undici';
import type { LookupAddress } from 'node:dns';

const LOOPBACK_ADDRESSES: LookupAddress[] = [
  { address: '127.0.0.1', family: 4 },
  { address: '::1', family: 6 },
];

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === 'localhost' || host.endsWith('.localhost');
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

function loopbackLookup(_hostname: string, options: any, callback: LookupCallback): void {
  const family = typeof options === 'number' ? options : options?.family;
  const candidates = family === 4 || family === 6
    ? LOOPBACK_ADDRESSES.filter((a) => a.family === family)
    : LOOPBACK_ADDRESSES;
  if (options?.all) {
    callback(null, candidates);
  } else {
    callback(null, candidates[0].address, candidates[0].family);
  }
}

let loopbackAgent: Agent | undefined;

/** The shared dispatcher used for loopback hosts. Created on first use. */
export function getLoopbackDispatcher(): Agent {
  loopbackAgent ??= new Agent({
    connect: { lookup: loopbackLookup as any, autoSelectFamily: true },
  });
  return loopbackAgent;
}

function requestHostname(input: any): string | undefined {
  try {
    const raw = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    return raw ? new URL(raw).hostname : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Drop-in for `globalThis.fetch` that resolves loopback hostnames the way a
 * browser does. Reads `globalThis.fetch` at call time so tests that stub it
 * still intercept every request.
 */
export function dixieFetch(input: any, init?: any): Promise<Response> {
  const hostname = requestHostname(input);
  if (hostname && isLoopbackHostname(hostname) && !init?.dispatcher) {
    return globalThis.fetch(input, { ...init, dispatcher: getLoopbackDispatcher() } as any);
  }
  return globalThis.fetch(input, init);
}
