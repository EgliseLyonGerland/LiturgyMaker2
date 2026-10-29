import { RouterContextProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/components/ui/toast";
import { clientAction } from "@/routes/liturgy";

import { getLiturgy, LiturgyConflictError, updateLiturgy } from "../api";
import { createDefaultLiturgy } from "../default-liturgy";
import { queryClient } from "../query-client";

vi.mock("../api", () => ({
  getLiturgy: vi.fn(),
  getSongs: vi.fn(),
  getRecitations: vi.fn(),
  updateLiturgy: vi.fn(),
  LiturgyConflictError: class extends Error {},
}));

vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

function submit(data: unknown) {
  const context = new RouterContextProvider();
  vi.spyOn(context, "get").mockReturnValue({ auth: { uid: "current-user" } });

  return clientAction({
    params: { liturgyId: "2026-11-01" },
    url: new URL("http://localhost/liturgies/2026-11-01"),
    pattern: "/liturgies/:liturgyId",
    request: new Request("http://localhost/liturgies/2026-11-01", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    context,
    serverAction: vi.fn(),
  });
}

function save(overwrite = false) {
  return {
    intent: "save",
    liturgy: { ...createDefaultLiturgy(), revision: "opened-revision" },
    overwrite,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  queryClient.clear();
});

describe("liturgy submissions", () => {
  it.each([false, true])(
    "saves with overwrite=%s and the authenticated author",
    async (overwrite) => {
      expect(await submit(save(overwrite))).toEqual({ status: "saved" });
      expect(updateLiturgy).toHaveBeenCalledWith(
        "2026-11-01",
        { ...createDefaultLiturgy(), uid: "current-user", revision: "opened-revision" },
        overwrite,
      );
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    },
  );

  it("reports a conflict without reporting a successful save", async () => {
    vi.mocked(updateLiturgy).mockRejectedValueOnce(new LiturgyConflictError());

    expect(await submit(save())).toEqual({ status: "conflict" });
    expect(toast.add).not.toHaveBeenCalled();
    expect(getLiturgy).not.toHaveBeenCalled();
  });

  it("reloads from the server without writing", async () => {
    const liturgy = { ...createDefaultLiturgy(), revision: "old" };
    queryClient.setQueryData(["liturgies", "2026-11-01"], liturgy);
    vi.mocked(getLiturgy).mockImplementationOnce(async () => {
      expect(queryClient.getQueryState(["liturgies", "2026-11-01"])?.isInvalidated).toBe(true);
      return { ...liturgy, revision: "fresh" };
    });
    expect(await submit({ intent: "reload" })).toEqual({ status: "reloaded" });
    expect(getLiturgy).toHaveBeenCalledWith("2026-11-01");
    expect(updateLiturgy).not.toHaveBeenCalled();
  });

  it.each(["save", "reload"])("reports a failed %s explicitly", async (intent) => {
    const error = new Error("Offline");
    vi.mocked(updateLiturgy).mockRejectedValueOnce(error);
    vi.mocked(getLiturgy).mockRejectedValueOnce(error);

    expect(await submit(intent === "save" ? save() : { intent })).toEqual({ status: "error" });
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });

  it("waits for the server read before reporting a successful reload", async () => {
    let finishRead: (liturgy: ReturnType<typeof createDefaultLiturgy>) => void = () => {
      throw new Error("The server read has not started");
    };
    vi.mocked(getLiturgy).mockReturnValueOnce(
      new Promise((resolve) => {
        finishRead = resolve;
      }),
    );
    const finished = vi.fn();
    const reloading = submit({ intent: "reload" }).then(finished);
    await vi.waitFor(() => expect(getLiturgy).toHaveBeenCalledOnce());

    expect(finished).not.toHaveBeenCalled();
    finishRead(createDefaultLiturgy());
    await reloading;
    expect(finished).toHaveBeenCalledWith({ status: "reloaded" });
  });

  it("does not accept an overwrite without a boolean flag", async () => {
    expect(await submit({ ...save(), overwrite: "true" })).toEqual({ status: "error" });
    expect(updateLiturgy).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });
});
