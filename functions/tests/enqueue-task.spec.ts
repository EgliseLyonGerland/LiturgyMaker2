import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enqueue: vi.fn(),
  taskQueue: vi.fn(),
  getClient: vi.fn(),
  getProjectId: vi.fn(),
  request: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("firebase-admin/functions", () => ({
  getFunctions: () => ({ taskQueue: mocks.taskQueue }),
}));
vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    constructor() {
      mocks.auth();
    }
    getClient = mocks.getClient;
    getProjectId = mocks.getProjectId;
  },
}));

import enqueueTask from "../src/utils/enqueue-task";

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("FUNCTIONS_EMULATOR", undefined);
  vi.stubEnv("CLOUD_TASKS_EMULATOR_HOST", undefined);
  mocks.taskQueue.mockReturnValue({ enqueue: mocks.enqueue });
  mocks.getProjectId.mockResolvedValue("test-project");
  mocks.getClient.mockResolvedValue({ request: mocks.request });
  mocks.request.mockResolvedValue({ data: { serviceConfig: { uri: "https://function.example" } } });
});

describe("enqueueTask", () => {
  it("uses the Tasks emulator without querying Google APIs", async () => {
    vi.stubEnv("FUNCTIONS_EMULATOR", "true");
    vi.stubEnv("CLOUD_TASKS_EMULATOR_HOST", "127.0.0.1:9499");
    await enqueueTask("updateSongTask", { songId: "song-1" });
    expect(mocks.taskQueue).toHaveBeenCalledWith("locations/europe-west1/functions/updateSongTask");
    expect(mocks.enqueue).toHaveBeenCalledWith({ songId: "song-1" });
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("fails explicitly rather than enqueuing in production when Tasks is missing", async () => {
    vi.stubEnv("FUNCTIONS_EMULATOR", "true");
    await expect(enqueueTask("updateSongTask", {})).rejects.toThrow(
      "Tasks emulator must be running",
    );
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("keeps the deployed function URI resolution in production", async () => {
    await enqueueTask("deleteSongTask", { songId: "song-1" });
    expect(mocks.request).toHaveBeenCalledWith({
      url: "https://cloudfunctions.googleapis.com/v2/projects/test-project/locations/europe-west1/functions/deleteSongTask",
    });
    expect(mocks.enqueue).toHaveBeenCalledWith(
      { songId: "song-1" },
      { uri: "https://function.example" },
    );
  });

  it("reports a missing deployed function URI", async () => {
    mocks.request.mockResolvedValue({ data: {} });
    await expect(enqueueTask("missing", {})).rejects.toThrow("Unable to retrieve URI");
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});
