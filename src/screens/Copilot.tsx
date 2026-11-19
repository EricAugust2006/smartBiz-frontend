"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUp, Bot } from "lucide-react";
import { Button, Card } from "../components/ui";
import { api, getRequestErrorMessage } from "@/lib/axios";

const suggestions = [
  "Quanto faturei hoje?",
  "O que preciso repor?",
  "Quais itens vencem essa semana?",
  "Como está o Clube VIP?",
];

type Message = { role: "user" | "assistant"; text: string };

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const ask = useMutation({
    mutationFn: async (question: string) => {
      const { data } = await api.post<unknown>("/copilot/ask", { question });
      if (typeof data === "string") return data;
      if (data && typeof data === "object") {
        const body = data as { answer?: unknown; reply?: unknown; message?: unknown };
        const answer = body.answer ?? body.reply ?? body.message ?? "";
        if (typeof answer === "string") return answer;
      }
      return "";
    },
    onSuccess: (answer, question) => setMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: answer }]),
  });
  function send(question: string) {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || ask.isPending) return;
    setPrompt("");
    ask.mutate(normalizedQuestion);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || ask.isPending) return;
    send(question);
  }
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header><h1 className="text-2xl font-semibold">Copiloto</h1><p className="mt-1 text-sm text-muted-foreground">Pergunte sobre os dados reais da sua loja.</p></header>
      <Card className="flex min-h-[65vh] flex-col p-5">
        <div className="flex-1 space-y-5 overflow-y-auto" aria-live="polite">
          {!messages.length && <p className="py-16 text-center text-muted-foreground">Faça uma pergunta sobre vendas, clientes ou estoque.</p>}
          {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" && <Bot size={18} aria-hidden="true" />}<p className="max-w-[85%] whitespace-pre-wrap rounded-xl bg-muted px-4 py-3 text-sm">{message.text}</p></div>)}
          {ask.isError && <p role="alert" className="text-sm text-destructive">{getRequestErrorMessage(ask.error, "Não foi possível consultar o copiloto. Tente novamente.")}</p>}
          {ask.isPending && <p className="text-sm text-muted-foreground">Consultando os dados da loja…</p>}
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-3 grid gap-2 sm:grid-cols-2" aria-label="Perguntas rápidas">
            {suggestions.map((suggestion) => (
              <Button key={suggestion} type="button" variant="outline" className="h-auto min-h-10 justify-start whitespace-normal py-2 text-left" disabled={ask.isPending} onClick={() => send(suggestion)}>
                {suggestion}
              </Button>
            ))}
          </div>
          <form onSubmit={submit} className="flex gap-2"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={2} placeholder="Escreva sua pergunta" className="min-w-0 flex-1 resize-y rounded-xl border border-input bg-card p-3 text-sm" /><Button type="submit" disabled={!prompt.trim() || ask.isPending} aria-label="Enviar pergunta"><ArrowUp size={17} /></Button></form>
        </div>
      </Card>
    </div>
  );
}
