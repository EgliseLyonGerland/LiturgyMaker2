import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import inquirer from "inquirer";

import { fixEmulatorUser } from "../utils/emulator-auth.ts";

export const command = "emulator";
export const desc = "Replace local Firestore collections from backups and export emulator data";
export const builder = {
  yes: {
    type: "boolean" as const,
    default: false,
    describe: "Skip confirmation before replacing local collections",
  },
};

const root = fileURLToPath(new URL("../../", import.meta.url));
const collections = ["users", "liturgies", "songs", "recitations"];
const require = createRequire(import.meta.url);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(filename: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(root, filename), "utf8"));
}

function localEndpoint(config: unknown, name: string, defaultPort: number): string {
  const emulator = isRecord(config) ? config[name] : undefined;
  const host = isRecord(emulator) ? (emulator.host ?? "127.0.0.1") : "127.0.0.1";
  const port = isRecord(emulator) ? (emulator.port ?? defaultPort) : defaultPort;

  if (
    !["localhost", "127.0.0.1", "::1"].includes(String(host)) ||
    !Number.isInteger(port) ||
    typeof port !== "number" ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(`Invalid local ${name} emulator address in firebase.json`);
  }

  return `${host === "::1" ? "[::1]" : host}:${port}`;
}

async function loadBackups() {
  return Promise.all(
    collections.map(async (name) => {
      const filename = `.firebase/backup/${name}.json`;
      const items = await readJson(filename);
      if (!Array.isArray(items)) {
        throw new Error(`${filename}: expected an array of documents`);
      }

      const ids = new Set<string>();
      const documents = items.map((item: unknown) => {
        if (
          !isRecord(item) ||
          typeof item.id !== "string" ||
          item.id.length === 0 ||
          Buffer.byteLength(item.id) > 1500 ||
          item.id.includes("/") ||
          item.id === "." ||
          item.id === ".." ||
          /^__.*__$/.test(item.id)
        ) {
          throw new Error(`${filename}: invalid document ID`);
        }
        const { id, ...data } = item;
        if (ids.has(id)) {
          throw new Error(`${filename}: duplicate document ID "${id}"`);
        }
        ids.add(id);
        return { id, data };
      });
      return { name, documents };
    }),
  );
}

export function exportEmulators(projectId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        require.resolve("firebase-tools/lib/bin/firebase.js"),
        "emulators:export",
        path.join(root, ".firebase/export"),
        "--project",
        projectId,
        "--config",
        path.join(root, "firebase.json"),
        "--force",
      ],
      { cwd: root, stdio: "inherit" },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Emulator export failed (${signal ?? code}). Local data was updated but not saved; retry the export before stopping the emulators.`,
          ),
        );
      }
    });
  });
}

export async function handler({ yes }: { yes: boolean }): Promise<void> {
  const [backups, config, projects] = await Promise.all([
    loadBackups(),
    readJson("firebase.json"),
    readJson(".firebaserc"),
  ]);
  const projectId =
    isRecord(projects) && isRecord(projects.projects) ? projects.projects.default : undefined;
  if (typeof projectId !== "string" || !projectId) {
    throw new Error("Missing default project ID in .firebaserc");
  }
  const emulators = isRecord(config) ? config.emulators : undefined;
  const firestoreHost = localEndpoint(emulators, "firestore", 8080);
  const authHost = localEndpoint(emulators, "auth", 9099);
  const hubHost = localEndpoint(emulators, "hub", 4400);
  const response = await fetch(`http://${hubHost}/emulators`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(
      `Cannot contact the Emulator Hub (${response.status}). Run pnpm dev-server first.`,
    );
  }
  const running: unknown = await response.json();
  if (
    !isRecord(running) ||
    !isRecord(running.firestore) ||
    `${running.firestore.host === "::1" ? "[::1]" : running.firestore.host}:${running.firestore.port}` !==
      firestoreHost
  ) {
    throw new Error(
      "The running Firestore emulator does not match firebase.json. Run pnpm dev-server.",
    );
  }
  if (
    !isRecord(running.auth) ||
    `${running.auth.host === "::1" ? "[::1]" : running.auth.host}:${running.auth.port}` !== authHost
  ) {
    throw new Error("The running Auth emulator does not match firebase.json. Run pnpm dev-server.");
  }

  console.log(`Local Firestore: ${firestoreHost} (project ${projectId})`);
  for (const { name, documents } of backups) {
    console.log(`  ${name}: ${documents.length} documents`);
  }
  if (!yes) {
    const { ok } = await inquirer.prompt<{ ok: boolean }>([
      {
        name: "ok",
        message:
          "Replace these local collections (including subcollections), fix the local Auth UID and overwrite .firebase/export?",
        type: "confirm",
        default: false,
      },
    ]);
    if (!ok) {
      console.log("Aborted");
      return;
    }
  }

  async function setTriggersEnabled(enabled: boolean) {
    const operation = enabled ? "enableBackgroundTriggers" : "disableBackgroundTriggers";
    const response = await fetch(`http://${hubHost}/functions/${operation}`, {
      method: "PUT",
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      throw new Error(
        `Cannot ${enabled ? "enable" : "disable"} local function triggers (${response.status}). Check the Emulator UI before continuing.`,
      );
    }
  }
  const functionsRunning = isRecord(running.functions);
  try {
    if (functionsRunning) {
      await setTriggersEnabled(false);
    }
    await fixEmulatorUser(authHost, projectId);

    const previousHost = process.env.FIRESTORE_EMULATOR_HOST;
    process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
    let app: App | undefined;
    try {
      app = initializeApp({ projectId }, "backup-emulator");
      const db = getFirestore(app);
      for (const { name, documents } of backups) {
        const collection = db.collection(name);
        await db.recursiveDelete(collection);
        for (let offset = 0; offset < documents.length; offset += 400) {
          const batch = db.batch();
          for (const { id, data } of documents.slice(offset, offset + 400)) {
            batch.set(collection.doc(id), data);
          }
          await batch.commit();
        }
        console.log(`Collection "${name}" replaced (${documents.length} documents)`);
      }
      await exportEmulators(projectId);
    } finally {
      if (previousHost === undefined) {
        delete process.env.FIRESTORE_EMULATOR_HOST;
      } else {
        process.env.FIRESTORE_EMULATOR_HOST = previousHost;
      }
      if (app) {
        await deleteApp(app);
      }
    }
  } finally {
    if (functionsRunning) {
      await setTriggersEnabled(true);
    }
  }
  console.log("Done. Emulator data saved to .firebase/export.");
}
