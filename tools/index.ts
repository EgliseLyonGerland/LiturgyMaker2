import process from "node:process";

import firebaseAdmin from "firebase-admin";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import * as statsCommand from "./commands/stats";
import * as syncCommand from "./commands/sync";

yargs(hideBin(process.argv))
  .middleware(async () => {
    try {
      if (firebaseAdmin.apps.length === 0) {
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.applicationDefault(),
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
  .parse();
