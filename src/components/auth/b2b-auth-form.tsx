"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { useB2BLogin, useB2BRegister } from "@/hooks/use-b2b-auth";
import {
  getAuthErrorMessage,
  loginFormSchema,
  registerFormSchema,
  type RegisterInput,
} from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";

const loginFieldsSchema = loginFormSchema.extend({
  tenantName: z.string(),
  userName: z.string(),
});

function AuthField({
  id,
  label,
  error,
  hint,
  ...props
}: ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function PasswordField({
  id,
  error,
  hint,
  ...props
}: ComponentProps<typeof Input> & {
  id: string;
  error?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Senha</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="pr-12"
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute right-1 top-1 h-10 w-10"
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function B2BAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { toast } = useToast();
  const { hydrated, accessToken, user, tenant, message, setSession } =
    useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const lock = useRef(false);
  const login = useB2BLogin();
  const register = useB2BRegister();
  const isRegister = mode === "register";
  const form = useForm<RegisterInput>({
    resolver: zodResolver(isRegister ? registerFormSchema : loginFieldsSchema),
    defaultValues: { tenantName: "", userName: "", email: "", password: "" },
    mode: "onTouched",
  });
  const busy =
    form.formState.isSubmitting || login.isPending || register.isPending;
  const errors = form.formState.errors;

  useEffect(() => {
    if (hydrated && accessToken && user && tenant) router.replace("/painel");
  }, [hydrated, accessToken, user, tenant, router]);

  async function onSubmit(values: RegisterInput) {
    if (lock.current) return;
    lock.current = true;
    setSubmitError(null);
    try {
      const session = isRegister
        ? await register.mutateAsync(values)
        : await login.mutateAsync(values);
      if (!setSession(session)) {
        const error = isRegister
          ? "Sua conta foi criada, mas não foi possível salvar a sessão. Habilite o armazenamento e faça login."
          : (useAuthStore.getState().message ??
            "Não foi possível salvar a sessão.");
        setSubmitError(error);
        toast({
          title: "Não foi possível iniciar a sessão",
          description: error,
        });
        return;
      }
      toast({
        title: isRegister
          ? "Conta criada com sucesso!"
          : "Login realizado com sucesso!",
        description: "Bem-vindo ao seu painel.",
      });
      router.replace("/painel");
    } catch (error: unknown) {
      const text = getAuthErrorMessage(error, mode);
      setSubmitError(text);
      toast({
        title: isRegister
          ? "Não foi possível criar a conta"
          : "Não foi possível entrar",
        description: text,
      });
    } finally {
      lock.current = false;
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-6 pb-5 sm:p-8 sm:pb-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
          <Store size={25} aria-hidden="true" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          SmartBiz AI · Painel do lojista
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isRegister ? "Crie sua conta" : "Entrar no painel"}
        </h1>
        <CardDescription>
          {isRegister
            ? "Cadastre seu estabelecimento e comece seu programa de fidelidade."
            : "Acesse sua loja e acompanhe suas próximas conquistas."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          aria-busy={busy}
          className="space-y-5"
        >
          {(submitError || message) && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
            >
              {submitError ?? message}
            </p>
          )}
          <fieldset disabled={busy || !hydrated} className="space-y-5">
            {isRegister && (
              <>
                <AuthField
                  id="auth-tenant"
                  label="Nome do estabelecimento"
                  autoComplete="organization"
                  error={errors.tenantName?.message}
                  {...form.register("tenantName")}
                />
                <AuthField
                  id="auth-name"
                  label="Seu nome"
                  autoComplete="name"
                  error={errors.userName?.message}
                  {...form.register("userName")}
                />
              </>
            )}
            <AuthField
              id="auth-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.email?.message}
              {...form.register("email")}
            />
            <PasswordField
              id="auth-password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              error={errors.password?.message}
              hint={isRegister ? "Mínimo de 8 caracteres." : undefined}
              {...form.register("password")}
            />
          </fieldset>
          <Button
            type="submit"
            size="lg"
            disabled={busy || !hydrated}
            className="w-full bg-primary text-primary-foreground"
          >
            {busy && (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            )}
            {busy
              ? isRegister
                ? "Criando conta…"
                : "Entrando…"
              : isRegister
                ? "Criar conta"
                : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-primary-text underline-offset-4 hover:underline"
            >
              {isRegister ? "Entrar" : "Criar conta"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
