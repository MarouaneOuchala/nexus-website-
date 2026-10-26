import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const build = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_NEXUS_ANDROID_APP: "1" },
});
if (build.error) throw build.error;
if (build.status === null) throw new Error(`Android web build terminated: ${build.signal}`);
process.exit(build.status);
