import { beforeEach, describe, expect, it, vi } from "vitest";

import { fixEmulatorUser } from "../emulator-auth.ts";

const email = "oltodo@msn.com";
const uid = "0cOk4OLoXUcusgPMbwhnBdGLzt03";
const fetchMock = vi.fn();
const account = {
  localId: "previous-uid",
  email,
  passwordHash: "emulator-password-hash",
  salt: "emulator-salt",
  emailVerified: true,
  displayName: "Local user",
  customAttributes: '{"role":"admin"}',
  providerUserInfo: [{ providerId: "google.com", rawId: "google-user-id" }],
};

function reply(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  fetchMock.mockResolvedValue(reply({}));
  fetchMock.mockResolvedValueOnce(reply({ users: [account] }));
});

describe("local Auth UID correction", () => {
  it("recreates the account with the requested UID while preserving login data", async () => {
    await fixEmulatorUser("127.0.0.1:9099", "demo-test");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const requests = fetchMock.mock.calls.map(([url, options]) => ({
      operation: url.split(":").at(-1),
      body: JSON.parse(options.body),
    }));
    expect(requests).toEqual([
      { operation: "lookup", body: { email: [email], localId: [uid] } },
      { operation: "delete", body: { localId: "previous-uid" } },
      { operation: "batchCreate", body: { users: [{ ...account, localId: uid }] } },
    ]);
  });

  it("does nothing when the account already has the correct UID", async () => {
    fetchMock.mockReset().mockResolvedValue(reply({ users: [{ ...account, localId: uid }] }));
    await fixEmulatorUser("localhost:9099", "demo-test");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("refuses to overwrite a different account using the target UID", async () => {
    fetchMock
      .mockReset()
      .mockResolvedValue(reply({ users: [account, { localId: uid, email: "other@example.com" }] }));
    await expect(fixEmulatorUser("127.0.0.1:9099", "demo-test")).rejects.toThrow(
      "already belongs to another account",
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("reports a missing local account without creating or deleting anything", async () => {
    fetchMock.mockReset().mockResolvedValue(reply({}));
    await expect(fixEmulatorUser("127.0.0.1:9099", "demo-test")).rejects.toThrow(
      "Create the local Auth account",
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("restores the original account if importing the new UID fails", async () => {
    fetchMock.mockResolvedValueOnce(reply({}));
    fetchMock.mockResolvedValueOnce(reply({ error: [{ message: "Import rejected" }] }));
    await expect(fixEmulatorUser("127.0.0.1:9099", "demo-test")).rejects.toThrow(
      "Local Auth batchCreate failed",
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ users: [account] });
  });

  it("reports both errors if recovery also fails", async () => {
    fetchMock.mockResolvedValueOnce(reply({}));
    fetchMock.mockResolvedValue(reply({ error: { message: "Failed" } }, false));
    await expect(fixEmulatorUser("127.0.0.1:9099", "demo-test")).rejects.toThrow(
      "original account recovery both failed",
    );
  });

  it("never contacts a non-local Auth host", async () => {
    await expect(fixEmulatorUser("production.invalid:443", "demo-test")).rejects.toThrow(
      "only allowed on a local emulator",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
