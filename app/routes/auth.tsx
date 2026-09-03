import * as formisch from "@formisch/react";
import { useEffect } from "react";
import { useAuthState, useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router";
import * as v from "valibot";

import { FormishFieldError } from "@/components/formisch-field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { firebaseAuth } from "@/lib/firebase";

const formSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("L'adresse email est requise"),
    v.email("L'adresse email n'est pas valide."),
  ),
  password: v.pipe(v.string(), v.nonEmpty("Le mot de passe est requis")),
});

export default function Auth() {
  const [signInWithEmailAndPassword, , , authError] = useSignInWithEmailAndPassword(firebaseAuth);
  const navigate = useNavigate();
  const [user] = useAuthState(firebaseAuth);

  const form = formisch.useForm({
    schema: formSchema,
  });

  useEffect(() => {
    if (authError) {
      toast.add({
        title: "Connexion impossible",
        description: authError.message,
        type: "error",
      });
    }
  }, [authError]);

  if (user) {
    navigate("/", { replace: true });
    return null;
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
              <formisch.Form
                of={form}
                onSubmit={async ({ email, password }) => {
                  const credentials = await signInWithEmailAndPassword(email, password);

                  if (credentials) {
                    navigate("/", { replace: true });
                  }
                }}
              >
                <FieldGroup>
                  <formisch.Field of={form} path={["email"]}>
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.props.name}>Email</FieldLabel>
                        <Input
                          {...field.props}
                          id={field.props.name}
                          value={field.input}
                          type="email"
                          placeholder="m@exemple.com"
                          autoFocus
                          aria-invalid={!field.isValid}
                          required
                        />
                        <FormishFieldError
                          errors={field.errors}
                          isEdited={field.isEdited}
                          isSubmitted={form.isSubmitted}
                        />
                      </Field>
                    )}
                  </formisch.Field>
                  <formisch.Field of={form} path={["password"]}>
                    {(field) => (
                      <Field>
                        <div className="flex items-center">
                          <FieldLabel htmlFor={field.props.name}>Mot de passe</FieldLabel>
                          {/* <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Mot de passe oublié ?
                      </a> */}
                        </div>
                        <Input
                          {...field.props}
                          id={field.props.name}
                          value={field.input}
                          type="password"
                          aria-invalid={!field.isValid}
                          required
                        />
                        <FormishFieldError
                          errors={field.errors}
                          isEdited={field.isEdited}
                          isSubmitted={form.isSubmitted}
                        />
                      </Field>
                    )}
                  </formisch.Field>
                  <Field className="gap-8">
                    <Button type="submit" disabled={form.isSubmitting}>
                      {form.isSubmitting ? <Spinner /> : "Connexion"}
                    </Button>
                    <FieldDescription className="text-center">
                      Vous n'avez pas d'accès ? Veuillez contacter un membre du staff.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </formisch.Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
