import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
} from "firebase/firestore";
import { sort } from "radashi";
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
      const snapshot = await getDoc(doc(firebaseDb, "liturgies", id));

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

export async function updateLiturgy(id: string, data: Liturgy) {
  await setDoc(doc(firebaseDb, "liturgies", id), data);

  return queryClient.invalidateQueries({ queryKey: ["liturgies", id] });
}
