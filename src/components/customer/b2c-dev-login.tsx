"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { CustomerAppShell } from "@/components/customer/customer-app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

const loginSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "Cole um JWT B2C para continuar.")
    .refine(
      (token) => token.replace(/^Bearer\s+/i, "").trim().length > 0,
      "Cole um JWT B2C para continuar.",
    ),
});
type LoginInput = z.infer<typeof loginSchema>;

export function B2CDevLogin() {
  const router = useRouter();
  const { hydrated, message, setToken } = useB2CAuthStore();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { token: "" },
  });

  function onSubmit(values: LoginInput) {
    if (setToken(values.token)) router.replace("/cliente/dashboard");
  }

  return (
    <CustomerAppShell>
      <Card className="mt-4">
        <CardHeader>
          <KeyRound
            size={27}
            className="mb-3 text-primary-text"
            aria-hidden="true"
          />
          <CardTitle>Dev Login B2C</CardTitle>
          <CardDescription>
            Cole um JWT de cliente para acessar seu dashboard. O token precisa
            ter role B2C.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            {message && (
              <p
                role="alert"
                className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive"
              >
                {message}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="b2c-jwt">JWT B2C</Label>
              <Input
                id="b2c-jwt"
                type="password"
                placeholder="Cole seu JWT"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={!hydrated || form.formState.isSubmitting}
                aria-invalid={Boolean(form.formState.errors.token)}
                aria-describedby={
                  form.formState.errors.token ? "b2c-jwt-error" : undefined
                }
                {...form.register("token")}
              />
              {form.formState.errors.token && (
                <p
                  id="b2c-jwt-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.token.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!hydrated || form.formState.isSubmitting}
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </CustomerAppShell>
  );
}
