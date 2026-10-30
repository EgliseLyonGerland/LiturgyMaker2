import { valibotResolver } from "@hookform/resolvers/valibot";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { CheckIcon, ChevronLeftIcon, TriangleAlertIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useForm } from "react-hook-form";
import { Navigate, useFetcher, useSearchParams } from "react-router";
import * as v from "valibot";

import { FormFieldError } from "@/components/form-field-error";
import { LoadingScreen } from "@/components/loading-screen";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { firebaseAuth } from "@/lib/firebase";

import type { Route } from "./+types/auth";

type View = "login" | "forgot-password";

const loginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("L'adresse email est requise"),
    v.email("L'adresse email n'est pas valide."),
  ),
  password: v.pipe(v.string(), v.nonEmpty("Le mot de passe est requis")),
});

const forgotPasswordSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("L'adresse email est requise"),
    v.email("L'adresse email n'est pas valide."),
  ),
});

const actionSchema = v.variant("action", [
  v.object({
    action: v.literal("login"),
    data: loginSchema,
  }),
  v.object({
    action: v.literal("forgot-password"),
    data: forgotPasswordSchema,
  }),
]);

export async function clientAction({ request }: Route.ClientActionArgs) {
  const data = await request.json();

  try {
    const output = v.parse(actionSchema, data);

    switch (output.action) {
      case "login": {
        const { email, password } = output.data;

        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch {
          toast.add({
            title: "Connexion impossible",
            description: "Veuillez vérifier vos identifiants et réessayer.",
            type: "error",
          });
        }
        break;
      }

      case "forgot-password": {
        const { email } = output.data;

        try {
          await sendPasswordResetEmail(firebaseAuth, email);

          return { success: true };
        } catch {
          toast.add({
            title: "Impossible de réinitialiser le mot de passe",
            type: "error",
          });
        }

        break;
      }
    }
  } catch {}
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [user] = useAuthState(firebaseAuth);
  const [view, setView] = useState<View>("login");

  if (user) {
    const redirect = searchParams.get("redirect");

    return (
      <>
        <Navigate to={redirect || "/"} replace />
        <LoadingScreen />
      </>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 transition-[transform_opacity] duration-1000 md:p-10 starting:scale-95 starting:opacity-0">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {view === "login" ? (
            <LoginView onViewChange={setView} />
          ) : (
            <ForgotPasswordView onViewChange={setView} />
          )}
        </div>
      </div>
    </div>
  );
}

interface ViewProps {
  onViewChange: (view: View) => void;
}

function LoginView({ onViewChange }: ViewProps) {
  const fetcher = useFetcher();
  const [email, setEmail] = useQueryState("email", parseAsString);

  const { handleSubmit, register, subscribe, formState } = useForm({
    resolver: valibotResolver(loginSchema),
    defaultValues: {
      email: email ?? "",
    },
  });

  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => setEmail(values.email),
    });
  }, [subscribe, setEmail]);

  const { errors, isSubmitting } = formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Veuillez saisir vos identifiants.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => {
            return fetcher.submit(
              {
                action: "login",
                data,
              },
              {
                method: "post",
                encType: "application/json",
              },
            );
          }, console.error)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="m@exemple.com"
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
                autoFocus
              />
              <FormFieldError formState={formState} name="email" />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              </div>
              <Input
                {...register("password")}
                id="password"
                type="password"
                aria-invalid={!!errors.password}
                disabled={isSubmitting}
              />
              <FormFieldError formState={formState} name="password" />
            </Field>
            <Field className="gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : "Connexion"}
              </Button>
              <Button variant="link" type="button" onClick={() => onViewChange("forgot-password")}>
                Mot de passe oublié ?
              </Button>
              <FieldDescription className="pt-6 text-center">
                Vous n'avez pas d'accès ? Veuillez contacter un membre du staff.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function ForgotPasswordView({ onViewChange }: ViewProps) {
  const fetcher = useFetcher();
  const [email, setEmail] = useQueryState("email", parseAsString);

  const { handleSubmit, register, subscribe, formState } = useForm({
    resolver: valibotResolver(forgotPasswordSchema),
    defaultValues: {
      email: email ?? "",
    },
  });

  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => setEmail(values.email),
    });
  }, [subscribe, setEmail]);

  const { errors, isSubmitting } = formState;

  if (fetcher.data?.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
          <CheckIcon className="size-10 text-success" />
          <h2 className="font-semibold">Regardez votre boîte de réception…</h2>
          <p className="text-muted-foreground">
            Vous allez recevoir un email dans lequel vous trouverez un lien pour réinitialiser votre
            mot de passe. Après quoi vous pourrez vous connecter avec votre nouveau mot de passe.
          </p>

          <Alert className="bg-warning/20">
            <TriangleAlertIcon /> Pensez à vérifier votre dossier de spam
          </Alert>

          <Button type="button" className="mt-4 w-full" onClick={() => onViewChange("login")}>
            <ChevronLeftIcon /> Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Veuillez saisir votre email pour réinitialiser votre mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => {
            return fetcher.submit(
              {
                action: "forgot-password",
                data,
              },
              {
                method: "post",
                encType: "application/json",
              },
            );
          }, console.error)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="m@exemple.com"
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
                autoFocus
              />
              <FormFieldError formState={formState} name="email" />
            </Field>
            <Field className="gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : "Réinitialiser"}
              </Button>
              <Button variant="link" type="button" onClick={() => onViewChange("login")}>
                <ChevronLeftIcon /> Retour
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
