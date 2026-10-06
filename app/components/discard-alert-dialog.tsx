import type { Blocker } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DiscardAlertDialogProps {
  blocker: Extract<Blocker, { state: "blocked" }>;
}

export function DiscardAlertDialog({ blocker }: DiscardAlertDialogProps) {
  return (
    <AlertDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          blocker.reset();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandonner les modifications ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les modifications apportées n'ont pas été enregistrées et seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuer l'édition</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              blocker.proceed();
            }}
          >
            Abandonner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
