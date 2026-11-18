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

interface SongDocument {
  id: string;
}

const storage = getStorage();
const db = getFirestore();

async function getStore(): Promise<SongDocument[]> {
  const file = storage.bucket().file("songs.json");

  try {
    const result = await file.download();
    return JSON.parse(result.toString()) as SongDocument[];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 404) {
      logger.info("songs.json not found; initializing it from Firestore");
      const { docs } = await db.collection("songs").get();
      const data = docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      await file.save(JSON.stringify(data), { contentType: "application/json" });
      return data;
    }

    throw error;
  }
}

async function persistStore(songs: SongDocument[]) {
  const file = storage.bucket().file("songs.json");
  await file.save(JSON.stringify(songs), { contentType: "application/json" });
}

export const updateSongTask = onTaskDispatched<{ songId: string }>(
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
    const { songId } = req.data;
    const snapshot = await db.collection("songs").doc(songId).get();
    const index = store.findIndex((item) => item.id === songId);

    if (!snapshot.exists) {
      if (index > -1) {
        store.splice(index, 1);
        await persistStore(store);
        await deployPraiseExplorerApp();
      }
      logger.info(`Song ${songId} no longer exists; removed from index`);
      return;
    }
    const data = { ...snapshot.data(), id: songId };

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

export const deleteSongTask = onTaskDispatched<{ songId: string }>(
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
    const songs = await getStore();
    const { songId } = req.data;
    const index = songs.findIndex((item) => item.id === songId);

    if (index > -1) {
      songs.splice(index, 1);
    }

    await persistStore(songs);
    await deployPraiseExplorerApp();

    logger.log("Done");
  },
);

export const onSongUpdated = onDocumentUpdated(
  {
    document: "songs/{songId}",
  },
  async (event) => {
    const { songId } = event.params;
    await enqueueTask("updateSongTask", { songId });
  },
);

export const onSongCreated = onDocumentCreated(
  {
    document: "songs/{songId}",
  },
  async (event) => {
    const { songId } = event.params;
    await enqueueTask("updateSongTask", { songId });
  },
);

export const onSongDeleted = onDocumentDeleted(
  {
    document: "songs/{songId}",
  },
  async (event) => {
    const { songId } = event.params;
    await enqueueTask("deleteSongTask", { songId });
  },
);
