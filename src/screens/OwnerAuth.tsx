import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Field, Input, ThemeScope, cn } from "../components/ui";
import { useScreenInit } from "../useScreenInit";

/* Platform-level screens: SmartBiz's own ink brand, not the tenant's */
const PLATFORM_BRAND = "#18181b";

function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <ThemeScope brandHex={PLATFORM_BRAND} className="flex flex-col items-center px-4 py-10 sm:justify-center">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-[13px] font-bold text-white">S</span>
          <span className="text-[15px] font-semibold tracking-tight">SmartBiz AI</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </ThemeScope>
  );
}

function PasswordInput({ id, value, onChange, invalid, autoComplete }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} invalid={invalid} onChange={(e) => onChange(e.target.value)} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function OwnerLogin() {
  const init = useScreenInit();
  const router = useRouter();
  const [email, setEmail] = useState(typeof init.email === "string" ? init.email : "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>(
    init.loginError === true ? { form: "E-mail ou senha incorretos. Confira os dados ou redefina sua senha." } : {},
  );
  const [busy, setBusy] = useState(false);

  const submit = () => {
    const e: typeof errors = {};
    if (!emailOk(email)) e.email = "Informe um e-mail válido, como voce@padaria.com.br";
    if (!password) e.password = "Informe sua senha";
    setErrors(e);
    if (e.email || e.password) {
      document.getElementById(e.email ? "email" : "password")?.focus();
      return;
    }
    setBusy(true);
    setTimeout(() => router.push("/painel"), 800);
  };

  return (
    <AuthShell title="Entrar no painel" footer={<>Ainda não tem conta? <Link href="/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">Criar conta</Link></>}>
      <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {errors.form && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-[13px] text-destructive">{errors.form}</p>
        )}
        <Field id="email" label="E-mail" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={email} invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-[13px] font-medium">Senha</label>
            <button type="button" className="cursor-pointer text-[13px] font-medium text-muted-foreground hover:text-foreground hover:underline">Esqueci minha senha</button>
          </div>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={setPassword} invalid={!!errors.password} />
          {errors.password && <p className="text-[13px] text-destructive">{errors.password}</p>}
        </div>
        <Button type="submit" size="lg" className="mt-2 w-full" aria-busy={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function OwnerSignup() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", business: "", email: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "business" | "email" | "password" | "terms", string>>>({});
  const [busy, setBusy] = useState(false);
  const slug = slugify(f.business);

  const submit = () => {
    const e: typeof errors = {};
    if (!f.name.trim()) e.name = "Informe seu nome";
    if (!f.business.trim()) e.business = "Informe o nome do estabelecimento";
    if (!emailOk(f.email)) e.email = "Informe um e-mail válido, como voce@padaria.com.br";
    if (f.password.length < 8) e.password = "A senha precisa ter pelo menos 8 caracteres";
    if (!terms) e.terms = "Aceite os termos para continuar";
    setErrors(e);
    const first = (["name", "business", "email", "password", "terms"] as const).find((k) => e[k]);
    if (first) {
      document.getElementById("su-" + first)?.focus();
      return;
    }
    setBusy(true);
    setTimeout(() => router.push("/painel"), 900);
  };

  return (
    <AuthShell title="Criar conta" footer={<>Já tem conta? <Link href="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">Entrar</Link></>}>
      <form className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field id="su-name" label="Seu nome" error={errors.name}>
          <Input id="su-name" autoComplete="name" value={f.name} invalid={!!errors.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field
          id="su-business"
          label="Nome do estabelecimento"
          error={errors.business}
          hint={slug ? `Seu app do cliente: smartbiz.app/c/${slug}` : "Vira o endereço do app dos seus clientes"}
        >
          <Input id="su-business" autoComplete="organization" value={f.business} invalid={!!errors.business} onChange={(e) => setF({ ...f, business: e.target.value })} />
        </Field>
        <Field id="su-email" label="E-mail" error={errors.email}>
          <Input id="su-email" type="email" autoComplete="email" value={f.email} invalid={!!errors.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="su-password" className="text-[13px] font-medium">Senha</label>
          <PasswordInput id="su-password" autoComplete="new-password" value={f.password} onChange={(v) => setF({ ...f, password: v })} invalid={!!errors.password} />
          <p className={cn("text-[13px]", errors.password ? "text-destructive" : "text-muted-foreground")}>{errors.password ?? "Mínimo de 8 caracteres"}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              id="su-terms"
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input accent-foreground"
            />
            <span>Li e aceito os <a href="#" className="font-medium underline underline-offset-4">Termos de uso</a> e a <a href="#" className="font-medium underline underline-offset-4">Política de privacidade</a></span>
          </label>
          {errors.terms && <p className="text-[13px] text-destructive">{errors.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="mt-2 w-full" aria-busy={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}

