import { useState } from "react";

export function ImagePreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  try {
    new URL(url);
  } catch {
    return null;
  }

  if (failed) {
    return null;
  }

  return (
    <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-foreground/5 p-2">
      <img
        src={url}
        alt="Aperçu de l’image de la prédication"
        className="h-full max-w-full object-contain"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
