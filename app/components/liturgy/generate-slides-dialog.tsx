import { Dialog as DialogPrimitive } from "@base-ui/react";
import type { Liturgy, RecitationWithId, SongWithId } from "@liturgy-maker/shared";
import { format } from "date-fns";
import {
  AlertTriangleIcon,
  CodeIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "lucide-react";
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

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Alert, AlertTitle } from "../ui/alert";
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
        className="h-[calc(100svh-2rem)] max-h-200 grid-rows-[auto_minmax(0,1fr)] sm:max-w-2xl"
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
          Pour générer les slides, munissez-vous d’un Mac sur lequel Keynote est installé, puis
          suivez les instructions ci-dessous.
        </p>
        <Accordion defaultValue={["json"]} multiple={false} keepMounted>
          <AccordionItem value="json">
            <AccordionHeader>
              <AccordionTrigger>
                <StepTitle number={1}>Télécharger le fichier .json</StepTitle>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground">
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
                    <Button size="icon" variant="ghost" className="hidden md:inline-flex">
                      <CodeIcon /> <span className="sr-only">Afficher le code</span>
                    </Button>
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="keynote">
            <AccordionHeader>
              <AccordionTrigger>
                <StepTitle number={2}>Télécharger le modèle Keynote</StepTitle>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground">
                Téléchargez le fichier Keynote depuis le lien ci-dessous puis ouvrez-le. Laissez ce
                document ouvert car c’est dans celui-ci que les slides seront créées. Supprimez les
                slides déjà présentes dans le modèle si nécessaire.
              </p>
              <Button
                nativeButton={false}
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
              <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-50">
                <AlertTriangleIcon />
                <AlertTitle>
                  Supprimez les slides déjà présentes dans le modèle, à l’exception de celles qui
                  apparaissent fermées dans le panneau de navigation à gauche.
                </AlertTitle>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="application">
            <AccordionHeader>
              <AccordionTrigger>
                <StepTitle number={3}>Télécharger l’application</StepTitle>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground">
                Cliquez sur le bouton ci-dessous pour télécharger directement la dernière version de
                l’application. Double-cliquez ensuite sur le fichier .zip téléchargé pour le
                décompresser.
              </p>
              <DownloadApplicationButton />
              <Alert className="border-blue-200 bg-orange-50 text-orange-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50">
                <InfoIcon />
                <AlertTitle>
                  Si vous avez téléchargé l’application lors d’une précédente utilisation, vous
                  pouvez ignorer cette étape et réutiliser cette version.
                </AlertTitle>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="launch">
            <AccordionHeader>
              <AccordionTrigger>
                <StepTitle number={4}>Générer les slides</StepTitle>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent className="space-y-4">
              <p className="text-muted-foreground">
                Lancez l’application en double-cliquant dessus. Une fenêtre du Finder s’ouvrira et
                vous invitera à sélectionner le fichier .json téléchargé à l’étape 1.
              </p>
              <p className="text-muted-foreground">
                Si votre Mac vous demande si l’application peut contrôler Keynote, cliquez sur{" "}
                <strong>Autoriser</strong> ou <strong>OK</strong>. Cet accès est nécessaire pour
                créer les slides.
              </p>
              <p className="text-muted-foreground">
                Revenez ensuite au document Keynote laissé ouvert pour observer les slides se créer
                au fur et à mesure. Patientez jusqu’à la fin de la génération sans fermer le
                document.
              </p>
              <p className="text-muted-foreground">Vous pouvez maintenant diffuser les slides 🎉</p>
              <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-50">
                <AlertTitle>Si macOS bloque l’ouverture de l’application</AlertTitle>
                <ol className="mt-2 list-decimal space-y-2 pl-5 font-normal">
                  <li>
                    Dans le Finder, faites un <strong>clic droit sur l’application</strong>, puis
                    choisissez <strong>Ouvrir</strong>. Confirmez en cliquant à nouveau sur{" "}
                    <strong>Ouvrir</strong> si macOS vous le demande.
                  </li>
                  <li>
                    Si cette méthode ne fonctionne pas, ouvrez <strong>Réglages Système</strong> →{" "}
                    <strong>Confidentialité et sécurité</strong>. Dans la section Sécurité, cliquez
                    sur <strong>Ouvrir quand même</strong> à côté du message concernant
                    l’application, puis confirmez son ouverture.
                  </li>
                </ol>
              </Alert>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <CodeDialog {...props} />
    </>
  );
}

function StepTitle({ number, children }: { number: number; children: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
        {number}
      </span>
      {children}
    </span>
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
