import { readFileSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { format } from "date-fns";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import open from "open";
import { table } from "table";
import type { Argv } from "yargs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const command = "stats <command>";
export const desc = "Display stats";

const backupDir = path.join(__dirname, "../../.firebase/backup");

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface Song {
  id: string;
  title: string;
}

interface SongReference {
  id?: string;
}

interface LiturgyBlock {
  type: string;
  data: SongReference[] | { items: SongReference[] };
}

interface Liturgy {
  date: string;
  version: number;
  blocks: LiturgyBlock[];
}

interface SongStats {
  title: string;
  count: Record<string, number>;
}

interface SongsOptions {
  dryRun: boolean;
}

async function songsCommand({ dryRun }: SongsOptions) {
  const liturgies = JSON.parse(readFileSync(`${backupDir}/liturgies.json`, "utf8")) as Liturgy[];
  const songs = JSON.parse(readFileSync(`${backupDir}/songs.json`, "utf8")) as Song[];

  const stats = songs.reduce<Record<string, SongStats>>(
    (acc, { id, title }) => ({
      ...acc,
      [id]: { title, count: {} },
    }),
    {},
  );

  liturgies.forEach((liturgy) => {
    const date = new Date(liturgy.date);

    if (date.getDay() !== 0) {
      return;
    }

    const year = String(date.getFullYear());

    liturgy.blocks.forEach((block) => {
      if (block.type !== "songs") {
        return;
      }

      const items =
        liturgy.version > 5
          ? (block.data as { items: SongReference[] }).items
          : (block.data as SongReference[]);

      items.forEach(({ id }) => {
        if (!id) return;

        if (!(year in stats[id].count)) {
          stats[id].count[year] = 0;
        }

        stats[id].count[year] += 1;
      });
    });
  });

  const years = [...new Set(Object.values(stats).flatMap(({ count }) => Object.keys(count)))];

  const header = ["Titre", ...years, "Total"];

  const values = Object.values(stats)
    .map((item) => [
      item.title,
      ...years.map((year) => item.count[year] || 0),
      Object.values(item.count).reduce((total, count) => total + count, 0),
    ])
    .sort((a, b) => Number(b.at(-1)) - Number(a.at(-1)));

  if (dryRun) {
    console.log(table([header, ...values]));
    return;
  }

  const creds = JSON.parse(
    readFileSync(path.join(__dirname, "../../config/~egliselyongerland-642b3dfa5d11.json"), "utf8"),
  ) as ServiceAccount;
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const doc = new GoogleSpreadsheet("16KvjnOV9mygprQv1X47jrJ-jgfJQ9f2pXuA3CJA6Iig", auth);

  await doc.loadInfo();

  const sheet = doc.sheetsByTitle.Chants;

  await sheet.clear();
  await sheet.setHeaderRow(header);
  await sheet.addRows(values);
  await sheet.loadCells("A1:A1");

  const firstDate = new Date(liturgies[0].date);

  const lastDate = new Date(liturgies[liturgies.length - 1].date);
  const b1 = sheet.getCell(0, 0);
  b1.note = `Calculé sur les ${liturgies.length} cultes du ${format(
    firstDate,
    "dd/MM/yyyy",
  )} au ${format(lastDate, "dd/MM/yyyy")}`;

  await sheet.saveUpdatedCells();

  open(`https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}/edit#gid=0`);
}

export const builder = function builder(yargs: Argv) {
  return yargs.command(
    "songs",
    "Display stats about songs",
    { "dry-run": { type: "boolean", default: false } },
    songsCommand,
  );
};
