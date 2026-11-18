import { readFile } from "node:fs/promises";

import { GoogleAuth } from "google-auth-library";
import inquirer from "inquirer";

import { firebaseConfig } from "../../app/config/firebase.ts";
import { exportEmulators } from "./emulator.ts";

export const command = "storage-emulator";
export const desc = "Copy production JSON indexes to local Storage and export";
export const builder = {
  yes: { type: "boolean" as const, default: false, describe: "Skip local overwrite confirmation" },
  credentials: {
    type: "string" as const,
    describe: "Service account JSON path (otherwise use Application Default Credentials)",
  },
};
const filenames = ["songs.json", "liturgies.json", "latestLiturgies.json"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function handler({
  yes,
  credentials,
}: {
  yes: boolean;
  credentials?: string;
}): Promise<void> {
  const config: unknown = JSON.parse(
    await readFile(new URL("../../firebase.json", import.meta.url), "utf8"),
  );
  const emulators = isRecord(config) && isRecord(config.emulators) ? config.emulators : {};
  const hub = isRecord(emulators.hub) ? emulators.hub : {};
  const host = hub.host ?? "127.0.0.1";
  const port = hub.port ?? 4400;
  if (
    !["127.0.0.1", "localhost", "::1"].includes(String(host)) ||
    typeof port !== "number" ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("Storage import requires a local Emulator Hub");
  }
  const response = await fetch(`http://${host === "::1" ? "[::1]" : host}:${port}/emulators`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Cannot contact Emulator Hub (${response.status}); run pnpm dev-server first`);
  }
  const running: unknown = await response.json();
  const storage = isRecord(running) && isRecord(running.storage) ? running.storage : undefined;
  if (
    !storage ||
    !["127.0.0.1", "localhost", "::1"].includes(String(storage.host)) ||
    typeof storage.port !== "number"
  ) {
    throw new Error("Local Storage emulator is not running");
  }
  const { projectId, storageBucket } = firebaseConfig;
  if (!yes) {
    const { ok } = await inquirer.prompt<{ ok: boolean }>([
      {
        name: "ok",
        message: `Copy ${filenames.join(", ")} from gs://${storageBucket} to local Storage and overwrite .firebase/export? Production is read-only.`,
        type: "confirm",
        default: false,
      },
    ]);
    if (!ok) {
      console.log("Aborted");
      return;
    }
  }

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/devstorage.read_only"],
    ...(credentials ? { keyFilename: credentials } : {}),
  });
  const client = await auth.getClient();
  // Download and validate all objects before changing any local file.
  const files = await Promise.all(
    filenames.map(async (name) => {
      const { data } = await client.request<string>({
        url: `https://storage.googleapis.com/storage/v1/b/${storageBucket}/o/${name}?alt=media`,
        responseType: "text",
      });
      if (!Array.isArray(JSON.parse(data))) {
        throw new Error(`${name}: expected a JSON array in production Storage`);
      }
      return { name, data };
    }),
  );
  const storageHost = storage.host === "::1" ? "[::1]" : storage.host;
  for (const { name, data } of files) {
    const upload = await fetch(
      `http://${storageHost}:${storage.port}/v0/b/${storageBucket}/o?name=${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
        body: data,
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!upload.ok) {
      throw new Error(`Local Storage upload failed for ${name} (${upload.status})`);
    }
    console.log(`Copied ${name} to local gs://${storageBucket}`);
  }
  await exportEmulators(projectId);
  console.log("Local Storage files saved to .firebase/export. Production was not modified.");
}
