import { migrate, type Liturgy } from "@liturgy-maker/shared";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onTaskDispatched } from "firebase-functions/v2/tasks";

import deployPraiseExplorerApp from "./utils/deploy-praise-explorer-app";
import enqueueTask from "./utils/enqueue-task";

interface StoreItem {
  id: string;
  date: number;
  songs: string[];
}

const storage = getStorage();
const db = getFirestore();

function liturgyToStoreItem(id: string, liturgy: Liturgy) {
  const migrated = migrate(liturgy) as Liturgy;

  return {
    id,
    date: migrated.date,
    songs: migrated.blocks
      .filter((block) => block.type === "songs")
      .map((block) => block.data.items.map((song) => song.id).filter(Boolean))
      .flat(),
  };
}

async function getStore(): Promise<StoreItem[]> {
  const file = storage.bucket().file("liturgies.json");

  try {
    const result = await file.download();
    return JSON.parse(result.toString()) as StoreItem[];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 404) {
      logger.info("liturgies.json not found; initializing an empty index");

      const { docs } = await db.collection("liturgies").get();
      const data = docs.map<StoreItem>((doc) => liturgyToStoreItem(doc.id, doc.data() as Liturgy));
      file.save(JSON.stringify(data));

      return data;
    }
    throw error;
  }
}

async function persistStore(store: StoreItem[]) {
  store.sort((a, b) => b.date - a.date);
  const file = storage.bucket().file("liturgies.json");
  await file.save(JSON.stringify(store), { contentType: "application/json" });
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
      const filtered = store.filter((item) => item.id !== liturgyId);
      if (filtered.length !== store.length) {
        await persistStore(filtered);
        await deployPraiseExplorerApp();
      }
      logger.info(`Liturgy ${liturgyId} no longer exists; removed from index`);
      return;
    }

    const liturgy = snapshot.data() as Liturgy;

    const data: StoreItem = liturgyToStoreItem(liturgyId, liturgy);

    if (data.songs.length === 0) {
      const filtered = store.filter((item) => item.id !== liturgyId);
      await persistStore(filtered);
      await deployPraiseExplorerApp();
      logger.log(`No songs found for liturgy ${liturgyId}; removed from index`);
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
    const { liturgyId } = event.params;
    await enqueueTask("upsertLiturgiesTask", { liturgyId });
  },
);

export const onLiturgyCreated = onDocumentCreated(
  { document: "liturgies/{liturgyId}" },
  async (event) => {
    const { liturgyId } = event.params;
    await enqueueTask("upsertLiturgiesTask", { liturgyId });
  },
);

export const onLiturgyDeleted = onDocumentDeleted(
  { document: "liturgies/{liturgyId}" },
  async (event) => {
    const { liturgyId } = event.params;
    await enqueueTask("deleteLiturgiesTask", { liturgyId });
  },
);
