import process from "node:process";

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import * as statsCommand from "./commands/stats.ts";
import * as syncCommand from "./commands/sync.ts";

await yargs(hideBin(process.argv))
  .middleware(async (argv) => {
    if (argv._[0] === "sync" && (argv._[1] === "emulator" || argv._[1] === "storage-emulator")) {
      return;
    }
    try {
      if (getApps().length === 0) {
        initializeApp({
          credential: applicationDefault(),
          projectId: "liturgymaker",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur d'initialisation: ${message}`);
    }
  })
  .command(statsCommand.command, statsCommand.desc, statsCommand.builder)
  .command(syncCommand.command, syncCommand.desc, syncCommand.builder)
  .option("dev", {
    describe: "Use development data",
    boolean: true,
    default: false,
  })
  .demandCommand()
  .recommendCommands()
  .strict()
  .help()
  .parseAsync();
