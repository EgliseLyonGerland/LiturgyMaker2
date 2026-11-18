const email = "oltodo@msn.com";
const uid = "0cOk4OLoXUcusgPMbwhnBdGLzt03";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fixEmulatorUser(host: string, projectId: string): Promise<void> {
  if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
    throw new Error("Auth UID correction is only allowed on a local emulator");
  }

  async function request(operation: string, body: Record<string, unknown>) {
    const response = await fetch(
      `http://${host}/identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:${operation}`,
      {
        method: "POST",
        headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result: unknown = await response.json();
    if (
      !response.ok ||
      !isRecord(result) ||
      (Array.isArray(result.error) ? result.error.length > 0 : result.error !== undefined)
    ) {
      throw new Error(
        `Local Auth ${operation} failed (${response.status}): ${JSON.stringify(result)}`,
      );
    }
    return result;
  }

  // Use the emulator's raw account format to retain its password hash, salt and providers.
  const result = await request("lookup", { email: [email], localId: [uid] });
  const users = Array.isArray(result.users) ? result.users.filter(isRecord) : [];
  const user = users.find((item) => item.email === email);
  if (!user || typeof user.localId !== "string") {
    throw new Error(`Create the local Auth account ${email} before running this command.`);
  }
  if (user.localId === uid) {
    return;
  }
  if (users.some((item) => item.localId === uid)) {
    throw new Error(`Local Auth UID ${uid} already belongs to another account`);
  }

  await request("delete", { localId: user.localId });
  try {
    await request("batchCreate", { users: [{ ...user, localId: uid }] });
  } catch (error) {
    try {
      await request("batchCreate", { users: [user] });
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "Local Auth UID correction and original account recovery both failed",
      );
    }
    throw error;
  }
  console.log(`Local Auth: ${email} now uses UID ${uid}. Sign in again in the application.`);
}
