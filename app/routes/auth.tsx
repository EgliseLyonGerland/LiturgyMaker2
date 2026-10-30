import { valibotResolver } from "@hookform/resolvers/valibot";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useForm } from "react-hook-form";
import { Navigate, useFetcher, useSearchParams } from "react-router";
import * as v from "valibot";

import { FormFieldError } from "@/components/form-field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { firebaseAuth } from "@/lib/firebase";

import type { Route } from "./+types/auth";

const formSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("L'adresse email est requise"),
    v.email("L'adresse email n'est pas valide."),
  ),
  password: v.pipe(v.string(), v.nonEmpty("Le mot de passe est requis")),
});

export async function clientAction({ request }: Route.ClientActionArgs) {
  const data = await request.json();

  try {
    const { email, password } = v.parse(formSchema, data);
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  } catch {
    toast.add({
      title: "Connexion impossible",
      description: "Veuillez vérifier vos identifiants et réessayer.",
      type: "error",
    });
  }
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [user] = useAuthState(firebaseAuth);
  const fetcher = useFetcher();

  const { handleSubmit, register, formState } = useForm({
    resolver: valibotResolver(formSchema),
  });

  const { errors, isSubmitting } = formState;

  if (user) {
    const redirect = searchParams.get("redirect");

    return <Navigate to={redirect || "/"} replace />;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 transition-[transform_opacity] duration-1000 md:p-10 starting:scale-95 starting:opacity-0">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>Veuillez saisir vos identifiants.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit((data) => {
                  return fetcher.submit(data, {
                    method: "post",
                    encType: "application/json",
                  });
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
                  <Field className="gap-8">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner /> : "Connexion"}
                    </Button>
                    <FieldDescription className="text-center">
                      Vous n'avez pas d'accès ? Veuillez contacter un membre du staff.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
