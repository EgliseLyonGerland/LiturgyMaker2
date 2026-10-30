import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, type QueryDocumentSnapshot } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/components/ui/toast";

import { getCurrentUser } from "../current-user";
import { firebaseAuth, firebaseDb } from "../firebase";
import { queryClient } from "../query-client";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../firebase", () => ({
  firebaseAuth: {
    authStateReady: vi.fn(),
    currentUser: null,
  },
  firebaseDb: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

const profile = {
  firstName: "Jean",
  lastName: "Dupont",
  displayName: "Jean Dupont",
};

const auth = {
  uid: "user-1",
  email: "jean@example.com",
  getIdToken: vi.fn(),
} satisfies Partial<User>;

const authStateObserver = vi.mocked(onAuthStateChanged).mock.calls[0][1];

function notifyAuthStateChanged() {
  if (typeof authStateObserver !== "function") {
    throw new Error("Expected an auth state callback");
  }
  authStateObserver(firebaseAuth.currentUser);
}

function setAuth(user: Partial<User> | null) {
  Object.defineProperty(firebaseAuth, "currentUser", {
    configurable: true,
    value: user,
  });
}

function setProfile(data: unknown, exists = true) {
  vi.mocked(getDoc, { partial: true }).mockResolvedValue({
    exists(): this is QueryDocumentSnapshot<unknown> {
      return exists;
    },
    data: vi.fn().mockReturnValue(data),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  queryClient.clear();
  setAuth(auth);
});

describe("getCurrentUser()", () => {
  it("waits for Firebase Auth initialization before reading the current user", async () => {
    setAuth(null);
    vi.mocked(firebaseAuth.authStateReady).mockImplementation(async () => {
      setAuth(auth);
    });
    setProfile(profile);

    expect(await getCurrentUser()).toEqual({ auth, profile });
    expect(firebaseAuth.authStateReady).toHaveBeenCalledOnce();
    expect(doc).toHaveBeenCalledWith(firebaseDb, "users", auth.uid);
  });

  it("does not read Firestore when signed out", async () => {
    setAuth(null);

    expect(await getCurrentUser()).toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });

  it("keeps the original Firebase user instance and validates the profile", async () => {
    setProfile({ ...profile, ignoredField: true });

    const user = await getCurrentUser();

    expect(user?.auth).toBe(auth);
    expect(user?.auth.getIdToken).toBe(auth.getIdToken);
    expect(user?.profile).toEqual(profile);
    expect(toast.add).not.toHaveBeenCalled();
  });

  it("reuses the profile across consecutive navigation checks", async () => {
    setProfile(profile);

    await getCurrentUser();
    expect(await getCurrentUser()).toEqual({ auth, profile });

    expect(getDoc).toHaveBeenCalledOnce();
    expect(firebaseAuth.authStateReady).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent profile requests", async () => {
    setProfile(profile);

    const users = await Promise.all([getCurrentUser(), getCurrentUser()]);

    expect(users).toEqual([
      { auth, profile },
      { auth, profile },
    ]);
    expect(getDoc).toHaveBeenCalledOnce();
  });

  it("preserves the current account cache when its initial auth event arrives", async () => {
    setProfile(profile);
    await getCurrentUser();

    notifyAuthStateChanged();

    expect(await getCurrentUser()).toEqual({ auth, profile });
    expect(getDoc).toHaveBeenCalledOnce();
  });

  it("allows an absent profile with the email still available", async () => {
    setProfile(undefined, false);

    expect(await getCurrentUser()).toEqual({ auth, profile: null });
    expect(toast.add).not.toHaveBeenCalled();
  });

  it("also caches absent profiles", async () => {
    setProfile(undefined, false);

    await getCurrentUser();
    expect(await getCurrentUser()).toEqual({ auth, profile: null });
    expect(getDoc).toHaveBeenCalledOnce();
  });

  it.each([null, {}, { ...profile, firstName: 42 }, { ...profile, displayName: null }])(
    "warns and uses only the auth account for an invalid profile: %j",
    async (data) => {
      setProfile(data);

      expect(await getCurrentUser()).toEqual({ auth, profile: null });
      await getCurrentUser();
      expect(getDoc).toHaveBeenCalledOnce();
      expect(toast.add).toHaveBeenCalledOnce();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ type: "warning" }));
    },
  );

  it("does not reuse another account's profile after an account switch", async () => {
    setProfile(profile);
    await getCurrentUser();
    const nextAuth = { ...auth, uid: "user-2", email: "other@example.com" };
    setAuth(nextAuth);
    notifyAuthStateChanged();
    setProfile(undefined, false);

    expect(await getCurrentUser()).toEqual({ auth: nextAuth, profile: null });
    expect(doc).toHaveBeenLastCalledWith(firebaseDb, "users", "user-2");
    expect(queryClient.getQueryData(["user-profile", auth.uid])).toBeUndefined();
  });

  it("clears the profile on sign-out and reloads it when the same account signs back in", async () => {
    setProfile(profile);
    await getCurrentUser();

    setAuth(null);
    notifyAuthStateChanged();
    expect(await getCurrentUser()).toBeNull();
    expect(queryClient.getQueryData(["user-profile", auth.uid])).toBeUndefined();

    setAuth(auth);
    notifyAuthStateChanged();
    const updatedProfile = { ...profile, firstName: "Paul" };
    setProfile(updatedProfile);

    expect(await getCurrentUser()).toEqual({ auth, profile: updatedProfile });
    expect(getDoc).toHaveBeenCalledTimes(2);
  });

  it("propagates Firestore failures instead of treating them as missing profiles", async () => {
    const error = new Error("Permission denied");
    vi.mocked(getDoc).mockRejectedValue(error);

    await expect(getCurrentUser()).rejects.toBe(error);

    setProfile(profile);
    expect(await getCurrentUser()).toEqual({ auth, profile });
    expect(getDoc).toHaveBeenCalledTimes(2);
  });

  it("propagates authentication initialization failures", async () => {
    const error = new Error("Authentication failed");
    vi.mocked(firebaseAuth.authStateReady).mockRejectedValue(error);

    await expect(getCurrentUser()).rejects.toBe(error);
    expect(getDoc).not.toHaveBeenCalled();
  });
});
