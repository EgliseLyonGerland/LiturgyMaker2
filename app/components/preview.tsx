import Player from "react-player";

interface PreviewProps {
  title: string;
  url: string;
}

export default function Preview({ title, url }: PreviewProps) {
  if (url.includes("drive.google.com")) {
    return (
      <iframe
        height="140"
        src={url.replace("/view", "/preview")}
        title={`${title} preview`}
        width="100%"
        loading="lazy"
      />
    );
  }

  return <Player src={url} width="100%" height={260} controls />;
}
