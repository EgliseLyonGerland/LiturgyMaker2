import Player from "react-player";

interface PreviewProps {
  title: string;
  url: string;
}

export default function Preview({ title, url }: PreviewProps) {
  try {
    new URL(url);
  } catch {
    return null;
  }

  if (url.includes("drive.google.com")) {
    return (
      <iframe
        height="140"
        src={url.replace("/view", "/preview")}
        title={`Aperçu du chant ${title}`}
        width="100%"
        loading="lazy"
      />
    );
  }

  return (
    <Player src={url} width="100%" height={260} controls aria-label={`Aperçu du chant ${title}`} />
  );
}
