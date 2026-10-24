// @effect-diagnostics nodeBuiltinImport:off - Exercises build configuration in fresh Node processes.
import * as NodeChildProcess from "node:child_process";

import { describe, expect, it } from "vite-plus/test";

const loadConfig = (env: Record<string, string>) =>
  NodeChildProcess.spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'const { default: config } = await import("./vite.config.ts"); console.log(JSON.stringify(config.pack.exe?.targets ?? null));',
    ],
    {
      cwd: new URL("..", import.meta.url),
      env: { PATH: process.env.PATH, ...env },
      encoding: "utf8",
      timeout: 30_000,
    },
  );

describe("server executable build configuration", () => {
  it("requires the pinned runtime for host builds while allowing explicit target downloads", () => {
    const target = loadConfig({
      T3CODE_PACK_EXE: "1",
      T3CODE_PACK_EXE_TARGET: "linux-x64",
    });
    expect(target.status, target.stderr).toBe(0);
    const [{ nodeVersion }] = JSON.parse(target.stdout) as [{ nodeVersion: string }];

    const host = loadConfig({ T3CODE_PACK_EXE: "1" });
    if (process.versions.node === nodeVersion) {
      expect(host.status, host.stderr).toBe(0);
    } else {
      expect(host.status).not.toBe(0);
      expect(host.stderr).toContain(`must run with Node ${nodeVersion}`);
    }
  });

  it("allows ordinary bundles on the development runtime", () => {
    const bundle = loadConfig({});
    expect(bundle.status, bundle.stderr).toBe(0);
    expect(JSON.parse(bundle.stdout)).toBeNull();
  });
});
