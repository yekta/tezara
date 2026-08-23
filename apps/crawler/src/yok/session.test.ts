import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { APIResponse } from "playwright";
import { readAndDispose } from "./session.ts";

/**
 * Playwright retains every response body until it is disposed, and a lane's context
 * lives for the whole run — so "was dispose called?" is the whole point of these tests,
 * not an implementation detail. See the note on readAndDispose.
 */
function fakeResponse(
  body: string | Error,
  opts: { disposeFails?: boolean } = {},
): { res: APIResponse; disposed: () => number } {
  let disposed = 0;
  const res = {
    text: async () => {
      if (body instanceof Error) throw body;
      return body;
    },
    dispose: async () => {
      disposed++;
      if (opts.disposeFails) throw new Error("context already disposed");
    },
  };
  return { res: res as unknown as APIResponse, disposed: () => disposed };
}

describe("readAndDispose", () => {
  test("returns the body and releases Playwright's copy of it", async () => {
    const { res, disposed } = fakeResponse("<html>ok</html>");
    assert.equal(await readAndDispose(res), "<html>ok</html>");
    assert.equal(disposed(), 1);
  });

  test("releases the body even when the read fails", async () => {
    const { res, disposed } = fakeResponse(new Error("socket hang up"));
    await assert.rejects(readAndDispose(res), /socket hang up/);
    assert.equal(disposed(), 1);
  });

  test("a failed dispose does not turn a successful read into an error", async () => {
    const { res, disposed } = fakeResponse("<html>ok</html>", { disposeFails: true });
    assert.equal(await readAndDispose(res), "<html>ok</html>");
    assert.equal(disposed(), 1);
  });
});
