export interface SettleTimestamps {
  navigationStart: number;
  networkQuietAt: number;
  lastMutationAt: number;
  settledAt: number;
}

export interface DecomposedTiming {
  networkWaitMs: number;
  renderMs: number;
  idleMs: number;
  totalMs: number;
}

export function decomposeSettleTiming(timestamps: SettleTimestamps): DecomposedTiming {
  const networkWaitMs = timestamps.networkQuietAt - timestamps.navigationStart;
  const renderMs = timestamps.lastMutationAt - timestamps.networkQuietAt;
  const idleMs = timestamps.settledAt - timestamps.lastMutationAt;
  const totalMs = timestamps.settledAt - timestamps.navigationStart;

  return { networkWaitMs, renderMs, idleMs, totalMs };
}
