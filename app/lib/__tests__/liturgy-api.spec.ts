import {
  getDocFromServer,
  runTransaction,
  type QueryDocumentSnapshot,
  type Transaction,
} from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLiturgy, LiturgyConflictError, updateLiturgy } from "../api";
import { createDefaultLiturgy } from "../default-liturgy";
import { queryClient } from "../query-client";

const { transactionGet, transactionSet } = vi.hoisted(() => ({
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
}));

vi.mock("../firebase", () => ({ firebaseDb: {} }));
vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  getDocFromServer: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  setDoc: vi.fn(),
  runTransaction: vi.fn(
    async (
      _db: unknown,
      update: (transaction: Pick<Transaction, "get" | "set">) => Promise<unknown>,
    ) => update({ get: transactionGet, set: transactionSet }),
  ),
}));

function snapshot(data: Record<string, unknown> | null) {
  return {
    exists(): this is QueryDocumentSnapshot<unknown> {
      return data !== null;
    },
    data: vi.fn().mockReturnValue(data),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient.clear();
});

describe("liturgy concurrency", () => {
  it("loads a missing document without a revision", async () => {
    vi.mocked(getDocFromServer, { partial: true }).mockResolvedValueOnce(snapshot(null));
    expect(await getLiturgy("new")).toEqual(createDefaultLiturgy());
  });

  it.each([undefined, "revision-1"])("caches a liturgy with revision %s", async (revision) => {
    const liturgy = { ...createDefaultLiturgy(), ...(revision ? { revision } : {}) };
    vi.mocked(getDocFromServer, { partial: true }).mockResolvedValueOnce(snapshot(liturgy));

    expect(await getLiturgy("existing")).toEqual(liturgy);
    expect(await getLiturgy("existing")).toEqual(liturgy);
    expect(getDocFromServer).toHaveBeenCalledOnce();
  });

  it.each(["missing", "legacy", "revisioned"])("saves a %s liturgy", async (kind) => {
    const liturgy = {
      ...createDefaultLiturgy(),
      ...(kind === "revisioned" ? { revision: "opened" } : {}),
    };
    transactionGet.mockResolvedValue(snapshot(kind === "missing" ? null : liturgy));

    await updateLiturgy("existing", liturgy);

    expect(transactionSet).toHaveBeenCalledWith(
      { collection: "liturgies", id: "existing" },
      { ...liturgy, revision: expect.any(String) },
    );
    const saved = transactionSet.mock.calls[0][1];
    expect(saved.revision).not.toBe(liturgy.revision);
    expect(await getLiturgy("existing")).toEqual(saved);
    expect(getDocFromServer).not.toHaveBeenCalled();
  });

  it("can save twice in succession using the updated cached revision", async () => {
    const liturgy = { ...createDefaultLiturgy(), revision: "original" };
    transactionGet.mockResolvedValueOnce(snapshot(liturgy));
    await updateLiturgy("existing", liturgy);
    const saved = await getLiturgy("existing");
    transactionGet.mockResolvedValueOnce(snapshot(saved));

    await updateLiturgy("existing", saved);

    expect(transactionSet).toHaveBeenCalledTimes(2);
    expect((await getLiturgy("existing")).revision).not.toBe(saved.revision);
  });

  it.each([
    ["opened", "newer"],
    [undefined, "newer"],
    ["opened", null],
    ["opened", undefined],
  ])("rejects revision %s against %s without modifying the cache", async (expected, current) => {
    const liturgy = { ...createDefaultLiturgy(), ...(expected ? { revision: expected } : {}) };
    queryClient.setQueryData(["liturgies", "existing"], liturgy);
    transactionGet.mockResolvedValue(
      snapshot(
        current === null
          ? null
          : { ...createDefaultLiturgy(), ...(current ? { revision: current } : {}) },
      ),
    );

    await expect(updateLiturgy("existing", liturgy)).rejects.toBeInstanceOf(LiturgyConflictError);
    expect(transactionSet).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["liturgies", "existing"])).toEqual(liturgy);
  });

  it("allows an explicitly confirmed overwrite", async () => {
    const liturgy = { ...createDefaultLiturgy(), revision: "older" };
    transactionGet.mockResolvedValue(snapshot({ ...liturgy, revision: "newer" }));

    await updateLiturgy("existing", liturgy, true);

    expect(transactionSet).toHaveBeenCalledOnce();
  });

  it("preserves the cache after a failed commit", async () => {
    const liturgy = { ...createDefaultLiturgy(), revision: "original" };
    queryClient.setQueryData(["liturgies", "existing"], liturgy);
    const error = new Error("Offline");
    vi.mocked(runTransaction).mockRejectedValueOnce(error);

    await expect(updateLiturgy("existing", liturgy)).rejects.toBe(error);
    expect(queryClient.getQueryData(["liturgies", "existing"])).toEqual(liturgy);
  });

  it("reads the server after invalidation", async () => {
    const liturgy = { ...createDefaultLiturgy(), revision: "old" };
    queryClient.setQueryData(["liturgies", "existing"], liturgy);
    vi.mocked(getDocFromServer, { partial: true }).mockResolvedValueOnce(
      snapshot({ ...liturgy, revision: "new" }),
    );

    await queryClient.invalidateQueries({
      queryKey: ["liturgies", "existing"],
      refetchType: "none",
    });

    expect(await getLiturgy("existing")).toEqual({ ...liturgy, revision: "new" });
    expect(getDocFromServer).toHaveBeenCalledOnce();
  });
});
