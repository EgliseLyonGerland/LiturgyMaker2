import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  query,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import * as v from "valibot";

import { createDefaultLiturgy } from "./default-liturgy";
import { firebaseDb } from "./firebase";
import migrate from "./migrate";
import { queryClient } from "./query-client";
import {
  liturgySchema,
  recitationSchema,
  songSchema,
  type Liturgy,
  type Recitation,
  type RecitationWithId,
  type Song,
  type SongWithId,
} from "./schemas";

function sortSongs(songs: SongWithId[]) {
  return songs.toSorted((left, right) =>
    String(left.title ?? "").localeCompare(String(right.title ?? ""), "fr"),
  );
}

function sortRecitations(recitations: RecitationWithId[]) {
  return recitations.toSorted((left, right) =>
    String(left.title ?? "").localeCompare(String(right.title ?? ""), "fr"),
  );
}

export async function getSongs() {
  return await queryClient.query({
    queryKey: ["songs"],
    queryFn: async () => {
      const { docs } = await getDocs(query(collection(firebaseDb, "songs")));

      return sortSongs(
        docs
          .map((doc) => {
            const { success, output } = v.safeParse(songSchema, doc.data());

            return success ? { id: doc.id, ...output } : null;
          })
          .filter((item) => item !== null),
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export async function addSong(data: Song) {
  const ref = await addDoc(collection(firebaseDb, "songs"), data);

  return queryClient.setQueryData(["songs"], (oldSongs: SongWithId[]) =>
    sortSongs(oldSongs.concat({ id: ref.id, ...data })),
  );
}

export async function updateSong(id: string, data: Song) {
  await setDoc(doc(firebaseDb, "songs", id), data);

  return queryClient.setQueryData(["songs"], (oldSongs: SongWithId[]) =>
    sortSongs(oldSongs.map((s) => (s.id === id ? { id, ...data } : s))),
  );
}

export async function deleteSong(id: string) {
  await deleteDoc(doc(firebaseDb, "songs", id));

  return queryClient.setQueryData(["songs"], (oldSongs: SongWithId[]) =>
    sortSongs(oldSongs.filter((song) => song.id !== id)),
  );
}

export async function getRecitations() {
  return await queryClient.query({
    queryKey: ["recitations"],
    queryFn: async () => {
      const { docs } = await getDocs(query(collection(firebaseDb, "recitations")));

      return sortRecitations(
        docs
          .map((doc) => {
            const { success, output } = v.safeParse(recitationSchema, doc.data());

            return success ? { id: doc.id, ...output } : null;
          })
          .filter((item) => item !== null),
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export async function addRecitation(data: Recitation) {
  const ref = await addDoc(collection(firebaseDb, "recitations"), data);

  return queryClient.setQueryData(["recitations"], (oldRecitations: RecitationWithId[]) =>
    sortRecitations(oldRecitations.concat({ id: ref.id, ...data })),
  );
}

export async function updateRecitation(id: string, data: Recitation) {
  await setDoc(doc(firebaseDb, "recitations", id), data);

  return queryClient.setQueryData(["recitations"], (oldRecitations: RecitationWithId[]) =>
    sortRecitations(oldRecitations.map((s) => (s.id === id ? { id, ...data } : s))),
  );
}

export async function deleteRecitation(id: string) {
  await deleteDoc(doc(firebaseDb, "recitations", id));

  return queryClient.setQueryData(["recitations"], (oldRecitations: RecitationWithId[]) =>
    sortRecitations(oldRecitations.filter((recitation) => recitation.id !== id)),
  );
}

export async function getLiturgy(id: string) {
  return await queryClient.query({
    queryKey: ["liturgies", id],
    queryFn: async () => {
      const snapshot = await getDocFromServer(doc(firebaseDb, "liturgies", id));

      if (!snapshot.exists()) {
        return createDefaultLiturgy();
      }

      const { success, output } = v.safeParse(liturgySchema, migrate(snapshot.data()));

      return success ? output : createDefaultLiturgy();
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export class LiturgyConflictError extends Error {
  constructor() {
    super("La liturgie a été modifiée depuis son ouverture.");
    this.name = "LiturgyConflictError";
  }
}

export async function updateLiturgy(id: string, data: Liturgy, overwrite = false) {
  const ref = doc(firebaseDb, "liturgies", id);
  const revision = crypto.randomUUID();

  await runTransaction(firebaseDb, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const currentRevision = snapshot.exists()
      ? v.parse(v.optional(v.string()), snapshot.data().revision)
      : undefined;

    if (!overwrite && currentRevision !== data.revision) {
      throw new LiturgyConflictError();
    }

    transaction.set(ref, { ...data, revision });
  });

  queryClient.setQueryData(["liturgies", id], { ...data, revision });
}
