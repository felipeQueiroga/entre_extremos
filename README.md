# Entre Extremos

Plataforma de jogos online para jogar com amigos, em casal ou em grupo, usando salas com código, jogadores conectados em tempo real e chat compartilhado.

O projeto começou com o jogo **Entre Extremos** e agora também inclui **Entre Quatro Cores**, um jogo original de cartas com cores, números, ações e curingas.

## Funcionalidades

- Salas online com código de convite.
- Escolha de jogo ao criar sala.
- Chat compartilhado por sala.
- Jogadores conectados em tempo real.
- Suporte a acesso externo usando ngrok.

Jogos disponíveis:

- **Entre Extremos**: jogo de pistas, percepção e escala secreta.
- **Entre Quatro Cores**: jogo de cartas com quatro cores, números, ações e curingas.

## Entre Extremos

No Entre Extremos, um jogador vê um alvo secreto em uma escala de 0 a 100, dá uma dica, e os outros tentam posicionar o ponteiro o mais perto possível.

Funcionalidades:

- Modo casal para 2 jogadores.
- Modo times para vários jogadores.
- Baralho de cartas por grupos de temas.
- Modo livre, em que o psíquico define os extremos da rodada.
- Mostrador semicircular interativo com ponteiro arrastável.
- Revelação com faixa de pontuação.
- Fase de suspense antes da revelação.

### Temas de cartas

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

### Regras básicas

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

## Entre Quatro Cores

Entre Quatro Cores é um jogo original de cartas inspirado em mecânicas clássicas de jogos de cores, números, ações e curingas, sem usar nome, arte, textos ou assets oficiais de marcas existentes.

Objetivo:

- Ser o primeiro jogador a ficar sem cartas.

Regras principais:

- Cada jogador começa com 7 cartas.
- O baralho possui 108 cartas.
- Existem quatro cores: vermelho, azul, verde e amarelo.
- Cartas numéricas vão de 0 a 9.
- Cartas de ação: pular, inverter e comprar +2.
- Curingas permitem escolher a próxima cor.
- Curinga +4 permite escolher a cor e faz o próximo jogador comprar 4 cartas.
- O jogador pode jogar uma carta se ela combinar com a cor, número, ação atual ou se for curinga.
- Se não tiver carta jogável, compra cartas até conseguir uma jogável.
- Ao ficar com uma carta, o jogador deve apertar o botão `1`.
- Se esquecer de apertar `1`, outro jogador pode puni-lo com +2 cartas.

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

A lógica do Entre Quatro Cores fica em:

- `server/src/fourColors.ts`

O fluxo principal das salas e rodadas fica em:

- `server/src/rooms.ts`

A interface do jogo fica em:

- `client/src/pages/`
- `client/src/components/`
- `client/src/hooks/GameContext.tsx`

Componentes do Entre Quatro Cores:

- `client/src/components/four-colors/`

Componentes do Entre Extremos:

- `client/src/components/entre-extremos/`

## Build

Para validar o projeto inteiro:

```bash
npm run build
```

Esse comando roda a compilação TypeScript do pacote compartilhado, do servidor e do cliente.

## Autores

- Felipe Araujo
- Thamiris Araujo
