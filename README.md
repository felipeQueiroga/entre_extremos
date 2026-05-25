# Entre Extremos

Jogo online de pistas e percepção inspirado em escalas de extremos. Um jogador vê um alvo secreto em uma escala de 0 a 100, dá uma dica, e os outros tentam posicionar o ponteiro o mais perto possível.

## Funcionalidades

- Salas online com código de convite.
- Modo casal para 2 jogadores.
- Modo times para vários jogadores.
- Baralho de cartas por grupos de temas.
- Modo livre, em que o psíquico define os extremos da rodada.
- Mostrador semicircular interativo com ponteiro arrastável.
- Revelação com faixa de pontuação.
- Chat da sala.
- Fase de suspense antes da revelação.
- Suporte a acesso externo usando ngrok.

## Temas de cartas

Ao criar uma sala no modo Baralho, o host pode escolher quais grupos entram na partida:

- Relacionamento
- Pets
- Personalidade
- Signos
- Viagem
- Primeiro encontro
- Comida
- Filmes e séries
- Profissões
- Lugares
- Aleatórias

No modo Livre, o psíquico cria os dois extremos manualmente em cada rodada.

## Regras básicas

1. Uma carta define dois extremos, por exemplo `Frio` e `Quente`.
2. O psíquico vê o alvo secreto no mostrador.
3. O psíquico dá uma dica curta.
4. O palpiteiro ou time move o ponteiro tentando acertar o alvo.
5. A revelação mostra a distância e os pontos.

Pontuação:

- Distância até 4: 4 pontos
- Distância até 8: 3 pontos
- Distância até 12: 2 pontos
- Acima de 12: 0 pontos
- No modo times, o time adversário pode ganhar ponto extra ao acertar a direção do alvo.

## Tecnologias

- React
- Vite
- Tailwind CSS
- TypeScript
- Node.js
- Express
- Socket.IO
- npm workspaces

## Estrutura do projeto

```text
client/   Interface web em React
server/   Servidor Express + Socket.IO
shared/   Tipos, eventos e regras compartilhadas
```

## Como rodar localmente

Requisitos:

- Node.js instalado
- npm instalado

Instale as dependências:

```bash
npm install
```

Inicie cliente e servidor:

```bash
npm run dev
```

No Windows, você também pode usar:

```bat
iniciar.bat
```

O script libera as portas `3001`, `5173` e `5174` antes de iniciar.

URLs locais:

- Cliente: `http://localhost:5173`
- Servidor: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

## Como jogar online com ngrok

1. Rode o jogo localmente com `iniciar.bat`.
2. Em outra janela, rode:

```bat
expor-ngrok.bat
```

3. Envie para os outros jogadores apenas o link do cliente, indicado pelo script.
4. Todos devem abrir o mesmo link do cliente.

Observação: o ngrok precisa estar instalado e autenticado. Caso ainda não esteja, use:

```bash
ngrok config add-authtoken SEU_TOKEN
```

## Scripts úteis

```bash
npm run dev
```

Inicia servidor e cliente em modo desenvolvimento.

```bash
npm run build
```

Compila `shared`, `server` e `client`.

```bash
npm run start
```

Inicia o servidor compilado.

## Desenvolvimento

O contrato compartilhado entre cliente e servidor fica em `shared/`, especialmente:

- `shared/types.ts`
- `shared/events.ts`
- `shared/scoring.ts`

As cartas ficam em:

- `server/src/cards.ts`

O fluxo principal das salas e rodadas fica em:

- `server/src/rooms.ts`

A interface do jogo fica em:

- `client/src/pages/`
- `client/src/components/`
- `client/src/hooks/GameContext.tsx`

## Build

Para validar o projeto inteiro:

```bash
npm run build
```

Esse comando roda a compilação TypeScript do pacote compartilhado, do servidor e do cliente.
