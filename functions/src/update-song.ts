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

type Maybe<T> = T | undefined;

interface SongDocument {
  id: string;
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

async function getSongsFromStorage(): Promise<SongDocument[]> {
  const file = storage.bucket().file("songs.json");

  try {
    const result = await file.download();
    return JSON.parse(result.toString()) as SongDocument[];
  } catch {
    const { docs } = await db.collection("songs").get();
    const data = docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    file.save(JSON.stringify(data));
    return data;
  }
}

async function saveSongsToStorage(songs: SongDocument[]) {
  const file = storage.bucket().file("songs.json");
  await file.save(JSON.stringify(songs));
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
    const songs = await getSongsFromStorage();
    const { songId } = req.data;
    const snapshot = await db.collection("songs").doc(songId).get();

    const data = {
      id: songId,
      ...snapshot.data(),
    } as Maybe<SongDocument>;

    if (!data) {
      throw new Error(`Unable to find the song ${songId}`);
    }

    const index = songs.findIndex((item) => item.id === songId);

    if (index > -1) {
      songs[index] = data;
    } else {
      songs.push(data);
    }

    await saveSongsToStorage(songs);
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
    const songs = await getSongsFromStorage();
    const { songId } = req.data;
    const index = songs.findIndex((item) => item.id === songId);

    if (index > -1) {
      songs.splice(index, 1);
    }

    await saveSongsToStorage(songs);
    await deployPraiseExplorerApp();

    logger.log("Done");
  },
);

export const onSongUpdated = onDocumentUpdated(
  {
    document: "songs/{songId}",
  },
  async (event) => {
    const queue = getFunctions().taskQueue(`locations/${location}/functions/updateSongTask`);
    const uri = await getFunctionUrl("updateSongTask");
    const { songId } = event.params;
    await queue.enqueue({ songId }, { uri });
  },
);

export const onSongCreated = onDocumentCreated(
  {
    document: "songs/{songId}",
  },
  async (event) => {
    const queue = getFunctions().taskQueue(`locations/${location}/functions/updateSongTask`);
    const uri = await getFunctionUrl("updateSongTask");
    const { songId } = event.params;
    await queue.enqueue({ songId }, { uri });
  },
);

export const onSongDeleted = onDocumentDeleted(
  {
    document: "songs/{songId}",
  },
  async (event) => {
    const queue = getFunctions().taskQueue(`locations/${location}/functions/deleteSongTask`);
    const uri = await getFunctionUrl("deleteSongTask");
    const { songId } = event.params;
    await queue.enqueue({ songId }, { uri });
  },
);
