import { access, copyFile, mkdir, readFile, realpath, symlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

interface PackageJson {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  engines: { node: string };
}

const functionsDir = new URL("../", import.meta.url);
const buildDir = new URL("./build/", functionsDir);
const localSdkBinary = new URL("./node_modules/.bin/firebase-functions", functionsDir);
const buildBinDir = new URL("./node_modules/.bin/", buildDir);
const buildSdkBinary = new URL("./firebase-functions", buildBinDir);
const packageJson = JSON.parse(
  await readFile(new URL("./package.json", functionsDir), "utf8"),
) as PackageJson;

const externalDeps = Object.fromEntries(
  Object.entries(packageJson.dependencies).filter(
    ([, version]) => !version.startsWith("workspace:"),
  ),
);

await mkdir(buildDir, { recursive: true });

await copyFile(
  new URL("./.env.liturgymaker", functionsDir),
  new URL("./.env.liturgymaker", buildDir),
);

await build({
  absWorkingDir: fileURLToPath(functionsDir),
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  outfile: "build/index.js",
  sourcemap: true,
  external: Object.keys(externalDeps),
});

await writeFile(
  new URL("./package.json", buildDir),
  JSON.stringify(
    {
      name: packageJson.name,
      version: packageJson.version,
      private: true,
      main: "index.js",
      engines: packageJson.engines,
      dependencies: externalDeps,
    },
    null,
    2,
  ) + "\n",
);

await access(localSdkBinary);
await mkdir(buildBinDir, { recursive: true });

try {
  await symlink(fileURLToPath(localSdkBinary), buildSdkBinary);
} catch (error) {
  if (
    !(error instanceof Error && "code" in error && error.code === "EEXIST") ||
    (await realpath(buildSdkBinary)) !== (await realpath(localSdkBinary))
  ) {
    throw error;
  }
}
