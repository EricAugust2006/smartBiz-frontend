"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
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
import { b2cApi } from "@/lib/axios";
import { b2cAuthTokenSchema } from "@/lib/b2c-auth";
import {
  customerPhoneSchema,
  formatCustomerPhone,
  normalizeCustomerPhone,
} from "@/lib/sales";
import { useB2CAuthStore } from "@/store/useB2CAuthStore";

const loginSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(120),
  phone: z.string().transform(normalizeCustomerPhone).pipe(customerPhoneSchema),
});

type LoginInput = z.input<typeof loginSchema>;
type LoginValues = z.output<typeof loginSchema>;

export function B2CStoreLogin({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const token = useB2CAuthStore((state) => state.token);
  const storedSlug = useB2CAuthStore((state) => state.tenantSlug);
  const hydrated = useB2CAuthStore((state) => state.hydrated);
  const setSession = useB2CAuthStore((state) => state.setSession);
  const [requestError, setRequestError] = useState<string | null>(null);
  const form = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { name: "", phone: "" },
    mode: "onTouched",
  });
  const busy = form.formState.isSubmitting;
  const errors = form.formState.errors;

  useEffect(() => {
    if (hydrated && token && storedSlug === tenantSlug)
      router.replace("/cliente/dashboard");
  }, [hydrated, router, storedSlug, tenantSlug, token]);

  async function onSubmit(values: LoginValues) {
    setRequestError(null);
    try {
      const { data } = await b2cApi.post<unknown>("/auth/b2c", {
        tenantSlug,
        phone: values.phone,
        name: values.name,
      });
      const b2cToken = b2cAuthTokenSchema.parse(data);
      if (!setSession(b2cToken, tenantSlug)) {
        setRequestError(
          useB2CAuthStore.getState().message ??
            "Não foi possível salvar seu acesso neste dispositivo.",
        );
        return;
      }
      router.replace("/cliente/dashboard");
    } catch {
      setRequestError(
        "Não foi possível acessar o clube. Confira seus dados e tente novamente.",
      );
    }
  }

  return (
    <CustomerAppShell>
      <Card className="mt-4">
        <CardHeader>
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
            <Sparkles size={23} aria-hidden="true" />
          </span>
          <CardTitle>Entre no clube da loja</CardTitle>
          <CardDescription>
            Informe seu nome e telefone para acompanhar seus pontos e resgatar
            suas compras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            aria-busy={busy}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nome</Label>
              <Input
                id="customer-name"
                autoComplete="name"
                autoCapitalize="words"
                placeholder="Seu nome"
                disabled={!hydrated || busy}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "customer-name-error" : undefined
                }
                {...form.register("name")}
              />
              {errors.name && (
                <p
                  id="customer-name-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Telefone com DDD</Label>
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(27) 99999-0000"
                disabled={!hydrated || busy}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "customer-phone-error" : undefined
                }
                value={formatCustomerPhone(form.watch("phone"))}
                onChange={(event) =>
                  form.setValue(
                    "phone",
                    normalizeCustomerPhone(event.target.value),
                    {
                      shouldDirty: true,
                      shouldValidate: form.formState.isSubmitted,
                    },
                  )
                }
                onBlur={() => void form.trigger("phone")}
              />
              {errors.phone && (
                <p
                  id="customer-phone-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.phone.message}
                </p>
              )}
            </div>
            {requestError && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
              >
                {requestError}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!hydrated || busy}
            >
              {busy && (
                <Loader2
                  size={17}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {busy ? "Acessando…" : "Acessar meu clube"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </CustomerAppShell>
  );
}
