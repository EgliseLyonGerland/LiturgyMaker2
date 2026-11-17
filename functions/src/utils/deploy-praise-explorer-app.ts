import { env } from "node:process";

export default function deployPraiseExplorerApp() {
  if (env.FUNCTIONS_EMULATOR) {
    return;
  }

  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/vnd.github+json");
  myHeaders.append("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
  myHeaders.append("X-GitHub-Api-Version", "2022-11-28");
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    ref: "main",
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  } as const;

  fetch(
    "https://api.github.com/repos/EgliseLyonGerland/PraiseExplorer/actions/workflows/deploy.yml/dispatches",
    requestOptions,
  )
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
}
