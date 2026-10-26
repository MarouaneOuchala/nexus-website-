import { test } from "node:test";
import assert from "node:assert/strict";
import { createAdminSessionStorage, chooseAdminSessionStorage } from "../src/lib/admin-session.ts";

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
  key(index) { return [...this.values.keys()][index] ?? null; }
  clear() { this.values.clear(); }
}

const authKey = "sb-test-auth-token";

test("unchecked sessions stay in session storage and existing tab sessions still work", () => {
  const session = new MemoryStorage();
  const persistent = new MemoryStorage();
  const storage = createAdminSessionStorage(session, persistent);
  session.setItem(authKey, "existing-session");
  assert.equal(storage.getItem(authKey), "existing-session");
  storage.setItem(authKey, "refreshed-session");
  assert.equal(session.getItem(authKey), "refreshed-session");
  assert.equal(persistent.getItem(authKey), null);
  assert.equal(createAdminSessionStorage(new MemoryStorage(), persistent).getItem(authKey), null);
});

test("remembered login survives app/browser restart and refreshed tokens remain persistent", () => {
  const session = new MemoryStorage();
  const persistent = new MemoryStorage();
  session.setItem("nexus-admin-session-mode", "remember");
  session.setItem(authKey, "old-session");
  const storage = createAdminSessionStorage(session, persistent);
  storage.setItem(authKey, "remembered-session");
  assert.equal(persistent.getItem(authKey), "remembered-session");
  assert.equal(session.getItem(authKey), null);
  const restarted = createAdminSessionStorage(new MemoryStorage(), persistent);
  assert.equal(restarted.getItem(authKey), "remembered-session");
  restarted.setItem(authKey, "refreshed-remembered-session");
  assert.equal(persistent.getItem(authKey), "refreshed-remembered-session");
});

test("opting out removes persistent tokens and logout clears both stores without clearing preferences", () => {
  const session = new MemoryStorage();
  const persistent = new MemoryStorage();
  persistent.setItem("nexus-theme", "dark");
  persistent.setItem(authKey, "remembered-session");
  session.setItem("nexus-admin-session-mode", "session");
  const storage = createAdminSessionStorage(session, persistent);
  storage.setItem(authKey, "tab-only-session");
  assert.equal(persistent.getItem(authKey), null);
  assert.equal(session.getItem(authKey), "tab-only-session");
  persistent.setItem(authKey, "stale-copy");
  storage.removeItem(authKey);
  assert.equal(storage.getItem(authKey), null);
  assert.equal(persistent.getItem(authKey), null);
  assert.equal(session.getItem(authKey), null);
  assert.equal(persistent.getItem("nexus-theme"), "dark");
});

test("storage failures are surfaced rather than silently pretending login was remembered", () => {
  const session = new MemoryStorage();
  const persistent = new MemoryStorage();
  globalThis.window = { sessionStorage: session, localStorage: persistent };
  try {
    chooseAdminSessionStorage(true);
    assert.equal(session.getItem("nexus-admin-session-mode"), "remember");
    chooseAdminSessionStorage(false);
    assert.equal(session.getItem("nexus-admin-session-mode"), "session");
    persistent.setItem = () => { throw new Error("QuotaExceededError"); };
    assert.throws(() => chooseAdminSessionStorage(true), /AUTH_STORAGE_UNAVAILABLE/);
    session.setItem("nexus-admin-session-mode", "remember");
    assert.throws(() => createAdminSessionStorage(session, persistent).setItem(authKey, "token"), /QuotaExceededError/);
  } finally {
    delete globalThis.window;
  }
});
