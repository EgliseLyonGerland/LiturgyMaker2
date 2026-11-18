import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path, { dirname } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { getFirestore } from "firebase-admin/firestore";
import inquirer from "inquirer";
import ora from "ora";
import type { Argv } from "yargs";

import * as emulatorCommand from "./emulator.ts";
import * as storageEmulatorCommand from "./storage-emulator.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const command = "sync <command>";
export const desc = "Sync data";

const collections = ["users", "liturgies", "songs", "recitations"];
const backupDir = path.join(__dirname, "../../.firebase/backup");

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface BackupDocument {
  id: string;
  [key: string]: JsonValue;
}

interface RestoreOptions {
  env?: string;
}

async function confirm(message: string): Promise<boolean> {
  return (
    await inquirer.prompt([
      {
        name: "ok",
        message,
        type: "confirm",
        default: false,
      },
    ])
  ).ok;
}

async function backupCommand(): Promise<void> {
  const db = getFirestore();

  await collections.reduce(
    (p, name) =>
      p.then(async () => {
        const spinner = ora(`Collection "${name}"`).start();

        const { docs } = await db.collection(name).get();

        const data = docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        mkdirSync(backupDir, { recursive: true });

        writeFileSync(`${backupDir}/${name}.json`, JSON.stringify(data));

        spinner.succeed();
      }),
    Promise.resolve() as Promise<void>,
  );

  process.exit();
}

async function restoreCommand({ env }: RestoreOptions): Promise<void> {
  if (
    env === "production" &&
    !(await confirm("Are you sure you want to restore data on production database?"))
  ) {
    console.log("Aborted");
    process.exit();
  }

  const db = getFirestore();

  await Promise.all(
    collections.map((name) => {
      const doc = readFileSync(`${backupDir}/${name}.json`, "utf8");
      const items = JSON.parse(doc) as BackupDocument[];

      return Promise.all(
        items.map(({ id, ...data }) => {
          return db.collection(name).doc(id).set(data);
        }),
      ).then(() => {
        console.log(`Collection "${name}" restored`);
      });
    }),
  );

  console.log("Done");
  process.exit();
}

export const builder = function builder(yargs: Argv) {
  return yargs
    .command("backup", "backup data", {}, backupCommand)
    .command("restore", "Restore backup data", { env: { type: "string" } }, restoreCommand)
    .command(
      emulatorCommand.command,
      emulatorCommand.desc,
      emulatorCommand.builder,
      emulatorCommand.handler,
    )
    .command(
      storageEmulatorCommand.command,
      storageEmulatorCommand.desc,
      storageEmulatorCommand.builder,
      storageEmulatorCommand.handler,
    );
};
