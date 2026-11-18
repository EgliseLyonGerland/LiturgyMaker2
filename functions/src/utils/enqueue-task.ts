import { getFunctions } from "firebase-admin/functions";
import { GoogleAuth } from "google-auth-library";

const location = "europe-west1";

export default async function enqueueTask(name: string, data: object): Promise<void> {
  const queue = getFunctions().taskQueue(`locations/${location}/functions/${name}`);
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    if (!process.env.CLOUD_TASKS_EMULATOR_HOST) {
      throw new Error("The Tasks emulator must be running to enqueue local function tasks");
    }
    // The Tasks emulator resolves the local function URL when no URI is supplied.
    await queue.enqueue(data);
    return;
  }

  const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
  const projectId = await auth.getProjectId();
  const client = await auth.getClient();
  const response = await client.request<{ serviceConfig?: { uri: string } }>({
    url: `https://cloudfunctions.googleapis.com/v2/projects/${projectId}/locations/${location}/functions/${name}`,
  });
  const uri = response.data.serviceConfig?.uri;
  if (!uri) {
    throw new Error(`Unable to retrieve URI for function ${name}`);
  }
  await queue.enqueue(data, { uri });
}
