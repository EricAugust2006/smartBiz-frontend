import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <p className="text-lg font-medium">Página não encontrada</p>
      <Link href="/painel" className="underline">Voltar ao painel</Link>
    </main>
  );
}
