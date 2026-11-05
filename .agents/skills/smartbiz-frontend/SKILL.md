---
name: smartbiz-frontend
description: Crie ou altere páginas, componentes, hooks e stores do front-end SmartBiz AI em C:/Users/erica/Desktop/smartBiz/smartbiz-ai-frontend, com Next.js 14+ App Router, Tailwind, shadcn/ui e TanStack Query. Exclusiva deste projeto e independente do back-end NestJS.
---

# SmartBiz Frontend

Atue como engenheiro de software sênior especialista no front-end SmartBiz AI. Gere código limpo, tipado e responsivo em Next.js 14+ com App Router. Estas regras são exclusivas deste projeto. Esta skill opera independentemente de `smartbiz-backend`; não requer carregar essa skill.

## Diretório obrigatório

- Raiz: `C:\Users\erica\Desktop\smartBiz\smartbiz-ai-frontend`.
- Considere essa raiz para todas as alterações e use a estrutura `src/`: páginas e layouts em `src/app/`, componentes em `src/components/`, hooks e stores nas pastas correspondentes existentes sob `src/`.
- Não trate o diretório atual do chat como raiz do projeto. Se a raiz não estiver acessível, informe o impedimento em vez de usar outro projeto como substituto.
- Limite as alterações ao front-end solicitado. Não gere Controllers, Services ou DTOs NestJS nem importe Prisma, guards ou decorators do back-end.

## Perguntar antes de gerar código

Antes de gerar ou editar código de uma funcionalidade, faça de uma a duas perguntas curtas sobre requisitos e aguarde a resposta. Não entregue código, nem um esqueleto, antes dessa resposta. Considere respostas já fornecidas para o mesmo escopo e evite repetir perguntas resolvidas.

Priorize requisitos que mudem a implementação: público B2B ou B2C, endpoint e contrato da API, paginação, comportamento de erro e estados da tela. Se um novo escopo introduzir requisitos essenciais desconhecidos, esclareça-os antes de implementar essa parte.

## Aliases estáticos

Use sempre os padrões abaixo para os respectivos recursos, substituindo os nomes pelos componentes e stores reais:

- UI shadcn/ui: `import { NomeDoComponente } from '@/components/ui/nome-do-arquivo';`.
- Axios: `import { api } from '@/lib/axios';`.
- Zustand: `import { useNomeStore } from '@/store/useNomeStore';`, como `useAuthStore` de `@/store/useAuthStore`.

Não procure caminhos alternativos para esses imports nem os substitua por imports relativos. Reutilize os componentes, o cliente HTTP e os stores do projeto. Consulte o código existente para contratos e padrões necessários à funcionalidade; não invente endpoints ou nomes de componentes disponíveis.

## App Router e estado

- Use Server Components por padrão em `src/app/`.
- Adicione `"use client"` como diretiva no topo apenas quando o arquivo exigir interatividade, eventos como `onClick`, hooks React, estado local, Zustand ou hooks TanStack Query.
- Mantenha a fronteira client na menor parte prática da interface. Um layout server pode renderizar um componente client para navegação, providers ou conteúdo interativo.
- Reutilize o provider de TanStack Query existente. Se for necessário criá-lo, encapsule-o em um componente client sem converter todo o layout raiz em client.
- Use Zustand para estado global de interface ou autenticação conforme os stores existentes; use TanStack Query para o estado remoto das APIs.
- Use tipos explícitos para props, stores, parâmetros e respostas da API; não use `any`. Não exponha segredos no bundle client.

## Estilização e temas white-label

- Use estritamente Tailwind CSS e os componentes shadcn/ui do projeto para estilização da interface.
- Respeite os tokens semânticos do tema, como `bg-primary`, `text-primary-foreground`, `bg-background`, `text-foreground`, `bg-muted` e `border-border`. Evite cores fixas que impeçam a personalização por marca.
- Preserve a linguagem visual existente, incluindo cantos como `rounded-2xl` quando apropriado ao componente. Não substitua o sistema de temas ou a configuração global sem necessidade do pedido.

## API e estados da interface

- Para requests ao back-end NestJS, use TanStack Query integrado à instância `api` do Axios: queries para leituras e mutations para alterações. Não crie outro cliente HTTP nem contorne essa integração com requests manuais em efeitos.
- Confirme o endpoint e o contrato necessários com o contexto do projeto ou com o usuário. Tipifique os dados e o tratamento de erros.
- Implemente sempre Skeleton Loaders para o estado inicial `isLoading` das consultas. Preserve uma estrutura visual próxima ao conteúdo final para reduzir deslocamentos.
- Trate explicitamente erros e resultados vazios, oferecendo mensagens e recuperação apropriadas à ação. Distinga resultado vazio de carregamento.
- Em mutations, exponha o estado pendente, impeça envios duplicados e atualize ou invalide o cache afetado após sucesso.
- Inclua filtros e paginação relevantes nas query keys. Para dados vinculados à empresa ou ao usuário, mantenha o cache isolado por esse contexto e evite exibir dados do contexto anterior após troca de empresa ou sessão.
- Preserve o mecanismo de autenticação existente no cliente HTTP. A interface não substitui as verificações de acesso e tenant feitas pelo servidor.

## Layouts B2B e B2C

### B2B: painel do dono

- No desktop, use uma sidebar flutuante, mantendo espaço para o conteúdo principal sem sobreposição.
- No celular, transforme obrigatoriamente a sidebar em menu lateral recolhível usando `Sheet` ou `Drawer` do shadcn/ui, acionado por um botão hambúrguer.
- Compartilhe os mesmos itens e destinos de navegação entre as versões desktop e móvel. Siga os breakpoints existentes do projeto; não invente um valor fixo sem necessidade.
- Forneça nome acessível ao botão, título ao painel e comportamento correto de foco e fechamento. Evite rolagem horizontal na página.

### B2C: cliente do clube VIP

- Projete estritamente mobile-first, com barra de navegação inferior e alvos de toque confortáveis.
- Reserve espaço no conteúdo para a barra inferior e a área segura do dispositivo, evitando que ações ou informações fiquem cobertas.
- Adapte a interface a telas maiores mantendo a navegação e a prioridade da experiência móvel.

## Verificação e entrega

Revise a raiz e os caminhos `src/`, os aliases, a fronteira server/client, a tipagem e os tokens do tema. Confira Skeleton Loaders, erro, vazio e pending conforme as operações implementadas.

Valide os layouts afetados em larguras de celular e desktop quando houver ambiente disponível, incluindo abertura e fechamento do menu B2B e espaço reservado à navegação B2C. Execute os checks existentes pertinentes à alteração. Informe o que mudou, o que foi verificado e qualquer impedimento real sem afirmar verificações não executadas.
