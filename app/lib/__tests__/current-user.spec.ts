import type { User } from "firebase/auth";
import { doc, getDoc, type QueryDocumentSnapshot } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/components/ui/toast";

import { getCurrentUser } from "../current-user";
import { firebaseAuth, firebaseDb } from "../firebase";

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

  it("allows an absent profile with the email still available", async () => {
    setProfile(undefined, false);

    expect(await getCurrentUser()).toEqual({ auth, profile: null });
    expect(toast.add).not.toHaveBeenCalled();
  });

  it.each([null, {}, { ...profile, firstName: 42 }, { ...profile, displayName: null }])(
    "warns and uses only the auth account for an invalid profile: %j",
    async (data) => {
      setProfile(data);

      expect(await getCurrentUser()).toEqual({ auth, profile: null });
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ type: "warning" }));
    },
  );

  it("does not reuse another account's profile after an account switch", async () => {
    setProfile(profile);
    await getCurrentUser();
    const nextAuth = { ...auth, uid: "user-2", email: "other@example.com" };
    setAuth(nextAuth);
    setProfile(undefined, false);

    expect(await getCurrentUser()).toEqual({ auth: nextAuth, profile: null });
    expect(doc).toHaveBeenLastCalledWith(firebaseDb, "users", "user-2");
  });

  it("propagates Firestore failures instead of treating them as missing profiles", async () => {
    const error = new Error("Permission denied");
    vi.mocked(getDoc).mockRejectedValue(error);

    await expect(getCurrentUser()).rejects.toBe(error);
  });

  it("propagates authentication initialization failures", async () => {
    const error = new Error("Authentication failed");
    vi.mocked(firebaseAuth.authStateReady).mockRejectedValue(error);

    await expect(getCurrentUser()).rejects.toBe(error);
    expect(getDoc).not.toHaveBeenCalled();
  });
});
