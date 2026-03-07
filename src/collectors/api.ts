export interface ApiCall {
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
}

export interface ApiResult {
  calls: ApiCall[];
}

export function collectApi(calls: ApiCall[]): ApiResult {
  return {
    calls: calls.map(c => ({ ...c })),
  };
}
