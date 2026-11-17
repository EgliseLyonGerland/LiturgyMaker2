import { Dialog as DialogPrimitive } from "@base-ui/react";
import type { Liturgy, RecitationWithId, SongWithId } from "@liturgy-maker/shared";
import { format } from "date-fns";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { generateCode } from "@/lib/code";
import { getSlidesGeneratorDownloadUrl, slidesGeneratorReleaseUrl } from "@/lib/slides-generator";

import { Alert, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";
import { CodeDialog, codeDialogHandle } from "./code-dialog";

export const generateSlidesDialogHandle = DialogPrimitive.createHandle();

interface GenerateSlidesDialogProps {
  date: Date;
  songs: SongWithId[];
  recitations: RecitationWithId[];
}

export function GenerateSlidesDialog(props: GenerateSlidesDialogProps) {
  return (
    <Dialog handle={generateSlidesDialogHandle}>
      <DialogContent
        className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-2xl"
        keepMounted={false}
      >
        <DialogHeader className="pr-6">
          <DialogTitle>Générer les slides</DialogTitle>
        </DialogHeader>

        <Content {...props} />
      </DialogContent>
    </Dialog>
  );
}

function Content(props: GenerateSlidesDialogProps) {
  const { date, songs, recitations } = props;
  const { control } = useFormContext<Liturgy>();
  const code = useWatch({
    control,
    compute: (liturgy) => generateCode({ date, liturgy, songs, recitations }),
  });

  return (
    <>
      <div className="min-h-0 overflow-y-auto pr-2">
        <p className="mb-4">
          Pour générer les slides vous devez disposer un Mac équipé de Keynote. Suivez ensuite les
          étapes ci-dessous.
        </p>
        <ol className="list-decimal space-y-6 pl-6 marker:font-semibold marker:text-primary">
          <li className="space-y-2 pl-1">
            <h3 className="font-medium">Télécharger le fichier .json</h3>
            <p className="mb-4 text-muted-foreground">
              Ce fichier .json contient les informations nécessaires pour générer vos slides. Vous
              n’avez pas besoin de l’ouvrir ni de le modifier. Repérez simplement où il est
              enregistré, généralement dans le dossier Téléchargements.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                nativeButton={false}
                render={
                  <a
                    href={`data:application/json;charset=utf-8,${encodeURIComponent(code)}`}
                    download={`liturgie-${format(date, "yyyy-MM-dd")}.json`}
                  />
                }
              >
                <DownloadIcon />
                Télécharger le fichier .json
              </Button>
              <DialogTrigger
                handle={codeDialogHandle}
                render={
                  <Button size="sm" variant="ghost" className="hidden md:inline-flex">
                    Afficher le code
                  </Button>
                }
              />
            </div>
          </li>
          <Separator />
          <li className="space-y-2 pl-1">
            <h3 className="font-medium">Télécharger le modèle Keynote</h3>
            <p className="mb-4 text-muted-foreground">
              Téléchargez le fichier Keynote depuis le lien ci-dessous puis ouvrez-le. Laissez ce
              document ouvert car c’est dans celui-ci que les slides seront créées. Supprimez les
              slides déjà présentes dans le modèle si nécessaire.
            </p>

            <Button
              nativeButton={false}
              variant="outline"
              render={
                <a
                  href="https://drive.google.com/file/d/1GprojDkA9y_sVaS8arQztDFEkOwe-CcR/view"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Télécharger le modèle Keynote
              <ExternalLinkIcon />
              <span className="sr-only"> (nouvel onglet)</span>
            </Button>

            <Alert className="mt-4 border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-50">
              <AlertTitle>
                Attention : ne supprimez pas les slides qui apparaissent fermées dans le panneau de
                navigation de gauche
              </AlertTitle>
            </Alert>
          </li>
          <Separator />
          <li className="space-y-2 pl-1">
            <h3 className="font-medium">Télécharger l’application</h3>
            <p className="mb-4 text-muted-foreground">
              Cliquez sur le bouton ci-dessous pour télécharger directement la dernière version de
              l’application. Double-cliquez ensuite sur le fichier .zip téléchargé pour le
              décompresser.
            </p>

            <DownloadApplicationButton />

            <Alert className="mt-4 border-blue-200 bg-orange-50 text-orange-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50">
              <AlertTitle>
                Vous pouvez ignorer cette étape si vous avez déjà l’application.
              </AlertTitle>
            </Alert>
          </li>
          <Separator />
          <li className="space-y-2 pl-1">
            <h3 className="font-medium">Lancer l’application</h3>
            <p className="mb-4 text-muted-foreground">
              Vous pouvez désormais lancer l’application en double-cliquant dessus. Une fenêtre doit
              s'ouvrir pour demander de choisir le fichier .json téléchargé à l’étape 1.
            </p>
            <p className="mb-4 text-muted-foreground">
              Quand votre Mac demande si l’application peut contrôler Keynote, cliquez sur{" "}
              <strong>Autoriser</strong> ou <strong>OK</strong>. Cet accès est nécessaire pour créer
              les slides.
            </p>
            <p className="mb-4 text-muted-foreground">
              Revenez ensuite au document Keynote laissé ouvert dans lequel vous pouvez observer les
              slides se créer au fur et à mesure. Patientez jusqu’à la fin de la génération sans
              fermer le document.
            </p>
            <Alert className="mt-4 border-blue-200 bg-orange-50 text-orange-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50">
              <AlertTitle>
                Il se peut que macOS affiche un avertissement de sécurité qui empêche l’ouverture de
                l’application. Dans ce cas, faites un <strong>clic droit sur l’application</strong>,
                puis choisissez <strong>Ouvrir</strong>. Confirmez avec <strong>Ouvrir</strong> si
                macOS vous demande de vérifier sa provenance.
              </AlertTitle>
            </Alert>
          </li>
          <Separator />
        </ol>
      </div>
      <CodeDialog {...props} />
    </>
  );
}

function DownloadApplicationButton() {
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  async function downloadApplication() {
    setDownloading(true);
    setDownloadFailed(false);

    try {
      const url = await getSlidesGeneratorDownloadUrl();
      window.location.assign(url);
    } catch {
      setDownloadFailed(true);
      toast.add({
        title: "Impossible de télécharger l’application",
        description: "Réessayez ou utilisez le lien vers la page GitHub.",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={downloading}
        aria-busy={downloading}
        onClick={downloadApplication}
      >
        {downloading ? <Spinner /> : <DownloadIcon />}
        Télécharger l’application
      </Button>

      {downloadFailed && (
        <p role="alert" className="text-destructive">
          Le téléchargement n’a pas pu démarrer. Réessayez ou{" "}
          <a
            href={slidesGeneratorReleaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            ouvrez la page GitHub pour télécharger l’application (nouvel onglet)
          </a>
          .
        </p>
      )}
    </>
  );
}
