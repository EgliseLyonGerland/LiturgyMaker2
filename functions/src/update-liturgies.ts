import type { Liturgy } from "@liturgy-maker/shared";
import { getFirestore } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { GoogleAuth } from "google-auth-library";

import deployPraiseExplorerApp from "./utils/deploy-praise-explorer-app";

interface StoreItem {
  id: string;
  date: number;
  songs: string[];
}

const storage = getStorage();
const db = getFirestore();

const location = "europe-west1";

async function getFunctionUrl(name: string) {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const projectId = await auth.getProjectId();
  const url =
    "https://cloudfunctions.googleapis.com/v2beta/" +
    `projects/${projectId}/locations/${location}/functions/${name}`;

  const client = await auth.getClient();
  const res = await client.request<{ serviceConfig?: { uri: string } }>({ url });
  const uri = res.data?.serviceConfig?.uri;
  if (!uri) {
    throw new Error(`Unable to retreive uri for function at ${url}`);
  }
  return uri;
}

async function getStore(): Promise<StoreItem[]> {
  const file = storage.bucket().file("liturgies.json");

  try {
    const result = await file.download();
    return JSON.parse(result.toString()) as StoreItem[];
  } catch {
    return [];
  }
}

async function persistStore(store: StoreItem[]) {
  store.sort((a, b) => b.date - a.date);
  const file = storage.bucket().file("liturgies.json");
  await file.save(JSON.stringify(store));
}

export const upsertLiturgiesTask = onTaskDispatched<{ liturgyId: string }>(
  {
    retryConfig: {
      maxAttempts: 5,
      minBackoffSeconds: 60,
    },
    rateLimits: {
      maxConcurrentDispatches: 1,
    },
  },
  async (req) => {
    const store = await getStore();
    const { liturgyId } = req.data;
    const snapshot = await db.collection("liturgies").doc(liturgyId).get();

    if (!snapshot.exists) {
      throw new Error(`Unable to find the liturgy ${liturgyId}`);
    }

    const liturgy = snapshot.data() as Liturgy;

    const data: StoreItem = {
      id: liturgyId,
      date: liturgy.date,
      songs: liturgy.blocks
        .filter((block) => block.type === "songs")
        .map((block) => block.data.items.map((song) => song.id).filter(Boolean))
        .flat(),
    };

    if (data.songs.length === 0) {
      logger.log(`No songs found for liturgy ${liturgyId}`);
      return;
    }

    const index = store.findIndex((item) => item.id === liturgyId);

    if (index > -1) {
      store[index] = data;
    } else {
      store.push(data);
    }

    await persistStore(store);
    await deployPraiseExplorerApp();

    logger.log("Done");
  },
);

export const deleteLiturgiesTask = onTaskDispatched<{ liturgyId: string }>(
  {
    retryConfig: {
      maxAttempts: 5,
      minBackoffSeconds: 60,
    },
    rateLimits: {
      maxConcurrentDispatches: 1,
    },
  },
  async (req) => {
    const store = await getStore();
    const { liturgyId } = req.data;
    const index = store.findIndex((item) => item.id === liturgyId);

    if (index > -1) {
      store.splice(index, 1);
    }

    await persistStore(store);
    await deployPraiseExplorerApp();

    logger.log("Done");
  },
);

export const onLiturgyUpdated = onDocumentUpdated(
  { document: "liturgies/{liturgyId}" },
  async (event) => {
    const queue = getFunctions().taskQueue(`locations/${location}/functions/upsertLiturgiesTask`);
    const uri = await getFunctionUrl("upsertLiturgiesTask");
    const { liturgyId } = event.params;
    await queue.enqueue({ liturgyId }, { uri });
  },
);

export const onLiturgyCreated = onDocumentCreated(
  { document: "liturgies/{liturgyId}" },
  async (event) => {
    const queue = getFunctions().taskQueue(`locations/${location}/functions/upsertLiturgiesTask`);
    const uri = await getFunctionUrl("upsertLiturgiesTask");
    const { liturgyId } = event.params;
    await queue.enqueue({ liturgyId }, { uri });
  },
);

export const onLiturgyDeleted = onDocumentDeleted(
  { document: "liturgies/{liturgyId}" },
  async (event) => {
    const queue = getFunctions().taskQueue(`locations/${location}/functions/deleteLiturgiesTask`);
    const uri = await getFunctionUrl("deleteLiturgiesTask");
    const { liturgyId } = event.params;
    await queue.enqueue({ liturgyId }, { uri });
  },
);
