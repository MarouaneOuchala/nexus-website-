const modeKey = "nexus-admin-session-mode";

export function createAdminSessionStorage(session: Storage, persistent: Storage) {
  return {
    getItem(key: string) {
      return session.getItem(key) ?? persistent.getItem(key);
    },
    setItem(key: string, value: string) {
      const mode = session.getItem(modeKey);
      const remember = mode === "remember" || (mode === null && persistent.getItem(key) !== null);
      const target = remember ? persistent : session;
      const other = remember ? session : persistent;
      target.setItem(key, value);
      other.removeItem(key);
    },
    removeItem(key: string) {
      persistent.removeItem(key);
      session.removeItem(key);
    },
  };
}

export function chooseAdminSessionStorage(remember: boolean) {
  try {
    // Check both stores before login; never silently claim a session is remembered.
    for (const storage of [window.sessionStorage, window.localStorage]) {
      const probe = `${modeKey}-probe`;
      storage.setItem(probe, "1");
      storage.removeItem(probe);
    }
    window.sessionStorage.setItem(modeKey, remember ? "remember" : "session");
  } catch (cause) {
    throw new Error("AUTH_STORAGE_UNAVAILABLE", { cause });
  }
}
