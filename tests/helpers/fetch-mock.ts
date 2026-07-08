import { vi } from "vitest";
import type { Mock } from "vitest";

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>;

export const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const mockFetch = (handler: FetchHandler) => {
  const fetchMock = vi.fn(handler) as Mock;
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

export const mockFetchSequence = (
  responses: Array<{ body: unknown; status?: number; ok?: boolean }>
) => {
  let callIndex = 0;

  return mockFetch(() => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex += 1;

    return createJsonResponse(response.body, response.status ?? 200);
  });
};
