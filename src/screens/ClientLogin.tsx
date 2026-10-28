import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button, TenantMark, ThemeScope, cn } from "../components/ui";
import { tenant } from "../data";
import { useScreenInit } from "../useScreenInit";

function maskPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function ClientLogin() {
  const init = useScreenInit();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">(init.step === "code" ? "code" : "phone");
  const [phone, setPhone] = useState(init.step === "code" ? "11987654321" : "");
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string[]>(init.codeError === true ? ["0", "0", "0", "0", "0", "0"] : Array(6).fill(""));
  const [codeError, setCodeError] = useState(init.codeError === true ? "Código incorreto. Confira o SMS e digite de novo." : "");
  const [seconds, setSeconds] = useState(30);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "code" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  useEffect(() => {
    if (step === "code") boxes.current[code.findIndex((c) => !c) === -1 ? 5 : code.findIndex((c) => !c)]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const sendCode = () => {
    if (phone.length < 11) {
      setPhoneError("Digite o celular com DDD, como (11) 98765-4321");
      document.getElementById("phone")?.focus();
      return;
    }
    setPhoneError("");
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSeconds(30);
      setStep("code");
    }, 700);
  };

  const verify = (digits: string[]) => {
    const value = digits.join("");
    if (value.length < 6) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (value === "000000") {
        setCodeError("Código incorreto. Confira o SMS e digite de novo.");
        return;
      }
      router.push(`/c/${tenant.slug}`);
    }, 700);
  };

  const setDigit = (i: number, v: string) => {
    const chars = v.replace(/\D/g, "");
    if (!chars && v !== "") return;
    const next = [...code];
    if (chars.length > 1) {
      chars.slice(0, 6 - i).split("").forEach((c, k) => (next[i + k] = c));
    } else {
      next[i] = chars;
    }
    setCode(next);
    setCodeError("");
    const nextEmpty = next.findIndex((c) => !c);
    if (chars) boxes.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (next.every((c) => c)) verify(next);
  };

  return (
    <ThemeScope className="flex justify-center">
      <div className="flex min-h-screen w-full max-w-md flex-col px-6 pt-4 pb-8">
        <div className="h-10">
          {step === "code" && (
            <button
              onClick={() => { setStep("phone"); setCode(Array(6).fill("")); setCodeError(""); }}
              className="-ml-2 flex h-10 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={18} /> Trocar número
            </button>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <TenantMark />
          <span className="text-[15px] font-semibold tracking-tight">{tenant.name}</span>
        </div>

        {step === "phone" ? (
          <form key="phone" className="mt-10 flex flex-1 animate-fade-in flex-col" noValidate onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Entre com seu celular</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Enviamos um código por SMS. Sem senha.</p>

            <div className="mt-8 flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-[13px] font-medium">Celular</label>
              <div className={cn("flex h-14 items-center rounded-xl border bg-card shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1", phoneError ? "border-destructive" : "border-input")}>
                <span className="flex h-full items-center border-r border-border px-4 text-base font-medium text-muted-foreground">+55</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  aria-invalid={!!phoneError || undefined}
                  value={maskPhone(phone)}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 11)); setPhoneError(""); }}
                  placeholder="(11) 98765-4321"
                  className="h-full flex-1 bg-transparent px-4 text-lg font-medium tracking-wide outline-none placeholder:font-normal placeholder:text-subtle-foreground"
                />
              </div>
              {phoneError && <p className="text-[13px] text-destructive">{phoneError}</p>}
            </div>

            <div className="mt-auto flex flex-col gap-4 pt-10">
              <Button type="submit" size="lg" className="h-13 w-full text-base" aria-busy={busy}>
                {busy && <Loader2 size={18} className="animate-spin" />}
                Receber código por SMS
              </Button>
              <p className="text-center text-[13px] text-muted-foreground">
                Ao continuar, você aceita os <a href="#" className="underline underline-offset-4">Termos do Clube</a>
              </p>
            </div>
          </form>
        ) : (
          <form key="code" className="mt-10 flex flex-1 animate-fade-in flex-col" onSubmit={(e) => { e.preventDefault(); verify(code); }}>
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Digite o código</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Enviado para <span className="font-medium text-foreground">+55 {maskPhone(phone)}</span>
            </p>

            <fieldset className="mt-8">
              <legend className="sr-only">Código de 6 dígitos</legend>
              <div className="grid grid-cols-6 gap-2">
                {code.map((c, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxes.current[i] = el; }}
                    aria-label={`Dígito ${i + 1}`}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={6}
                    value={c}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !c && i > 0) boxes.current[i - 1]?.focus();
                    }}
                    className={cn(
                      "h-14 w-full rounded-xl border bg-card text-center text-2xl font-semibold tabular-nums shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      codeError ? "border-destructive" : c ? "border-primary-border" : "border-input",
                    )}
                  />
                ))}
              </div>
              {codeError && <p role="alert" className="mt-3 text-[13px] text-destructive">{codeError}</p>}
            </fieldset>

            <div className="mt-6 flex items-center gap-2 text-sm">
              {busy ? (
                <span className="flex items-center gap-2 text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Verificando código…</span>
              ) : seconds > 0 ? (
                <span className="text-muted-foreground tabular-nums">Reenviar código em 0:{String(seconds).padStart(2, "0")}</span>
              ) : (
                <button type="button" onClick={() => setSeconds(30)} className="cursor-pointer font-medium text-primary-text hover:underline">
                  Reenviar código
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </ThemeScope>
  );
}

