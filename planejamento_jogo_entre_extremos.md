# Planejamento do Jogo: Entre Extremos

## 1. Objetivo do Projeto

Desenvolver um jogo online inspirado na mecânica do Wavelength, voltado para jogar em rede com duas ou mais pessoas. O objetivo principal é criar uma experiência divertida, simples e funcional, permitindo que jogadores criem salas, entrem com identificação própria e participem de rodadas em tempo real.

O jogo deve ser desenvolvido com identidade própria, nome próprio, textos próprios, cartas próprias e layout próprio, evitando copiar assets, marca, textos ou visual do jogo original.

Nome temporário sugerido para o projeto:

**Entre Extremos**

---

## 2. Stack Recomendada

### Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

### Backend

- Node.js
- Express
- Socket.IO

### Banco de Dados

Para o MVP:

- SQLite ou armazenamento em memória no servidor

Para versão futura:

- PostgreSQL

### Deploy Futuro

Opções possíveis:

- Render
- Railway
- Fly.io
- VPS própria
- DigitalOcean

---

## 3. Justificativa da Stack

O ponto central do jogo é a comunicação em tempo real entre jogadores. Por isso, a combinação **React + Node.js + Socket.IO** é uma boa escolha.

O React facilita a criação da interface visual, enquanto o Socket.IO permite controlar salas, eventos em tempo real, reconexão de jogadores e sincronização do estado do jogo entre os participantes.

O backend deve ser responsável pelo estado oficial do jogo. O frontend apenas envia ações do usuário, como criar sala, entrar em sala, escolher time, enviar dica, mover ponteiro e confirmar palpites.

---

## 4. Estrutura Inicial do Projeto

```txt
entre-extremos/
  client/
    src/
      components/
      pages/
      hooks/
      types/
      App.tsx
      main.tsx
  server/
    src/
      index.ts
      rooms.ts
      game.ts
      cards.ts
      types.ts
  shared/
    types.ts
```

Também é possível iniciar com estrutura mais simples:

```txt
entre-extremos/
  client/
  server/
```

---

## 5. Requisitos do MVP

### 5.1 Home Page com Regras

A aplicação deve ter uma tela inicial com:

- Nome do jogo
- Explicação curta da proposta
- Botão para criar sala
- Campo para entrar em uma sala existente
- Seção com regras do jogo
- Seção com regras de pontuação

Exemplo de conteúdo da home:

```txt
Entre Extremos é um jogo de pistas, interpretação e percepção.
Um jogador recebe uma escala com dois conceitos opostos e precisa dar uma dica para que sua equipe descubra onde está o alvo secreto.
```

---

### 5.2 Identificação de Usuário

No MVP, não é necessário criar login com senha.

O jogador deve informar:

- Nome
- Código da sala, caso esteja entrando em uma sala existente

O servidor deve gerar um identificador temporário para cada jogador.

Exemplo:

```ts
Player {
  id: string;
  name: string;
  roomCode: string;
  team?: "A" | "B";
  isHost: boolean;
  connected: boolean;
}
```

---

### 5.3 Criação de Salas

O jogador deve poder criar uma sala.

Ao criar uma sala:

- O servidor gera um código curto, por exemplo `AB12CD`
- O jogador criador vira o host da sala
- A sala começa em estado de lobby
- Outros jogadores podem entrar usando o código

Exemplo de modelo:

```ts
Room {
  id: string;
  code: string;
  players: Player[];
  teams: {
    A: Player[];
    B: Player[];
  };
  score: {
    A: number;
    B: number;
  };
  currentRound?: RoundState;
  status: "lobby" | "playing" | "finished";
}
```

---

## 6. Regras do Jogo

### 6.1 Objetivo

O objetivo é ser o primeiro time a alcançar **10 pontos**.

### 6.2 Times

Os jogadores se dividem em dois times:

- Time A
- Time B

Para modo casal ou modo simplificado, o jogo pode permitir apenas dois jogadores, um em cada time.

### 6.3 Pontuação Inicial

Para equilibrar a partida:

- Time que começa: 0 pontos
- Segundo time: 1 ponto

Essa regra pode ser configurável.

---

## 7. Fluxo da Rodada

Cada rodada segue este fluxo:

1. O servidor escolhe uma carta com dois conceitos opostos.
2. O servidor sorteia uma posição secreta do alvo entre 0 e 100.
3. Um jogador do time ativo assume o papel de psíquico.
4. Apenas o psíquico vê a posição secreta do alvo.
5. O psíquico escreve uma única dica.
6. A equipe ativa discute e posiciona o ponteiro.
7. A equipe adversária aposta se o alvo está à esquerda ou à direita do ponteiro.
8. O servidor revela a posição do alvo.
9. O servidor calcula a pontuação.
10. A rodada termina e o próximo time joga.

---

## 8. Estado da Rodada

Exemplo de modelo:

```ts
RoundState {
  roundNumber: number;
  activeTeam: "A" | "B";
  psychicPlayerId: string;
  card: Card;
  targetPosition: number;
  clue?: string;
  guessPosition?: number;
  opponentDirectionGuess?: "left" | "right";
  revealed: boolean;
}
```

### Carta

```ts
Card {
  id: string;
  left: string;
  right: string;
}
```

Exemplos de cartas iniciais:

```ts
const cards = [
  { id: "1", left: "Frio", right: "Quente" },
  { id: "2", left: "Feio", right: "Bonito" },
  { id: "3", left: "Barato", right: "Caro" },
  { id: "4", left: "Normal", right: "Estranho" },
  { id: "5", left: "Chato", right: "Divertido" },
  { id: "6", left: "Fácil", right: "Difícil" },
  { id: "7", left: "Infantil", right: "Adulto" },
  { id: "8", left: "Comum", right: "Raro" },
  { id: "9", left: "Calmo", right: "Caótico" },
  { id: "10", left: "Seguro", right: "Perigoso" }
];
```

---

## 9. Sistema de Pontuação

A posição do alvo e do palpite devem ser representadas de 0 a 100.

Exemplo:

```ts
targetPosition = 63;
guessPosition = 59;
distance = Math.abs(targetPosition - guessPosition);
```

Pontuação sugerida:

```ts
if (distance <= 4) {
  points = 4;
} else if (distance <= 8) {
  points = 3;
} else if (distance <= 12) {
  points = 2;
} else {
  points = 0;
}
```

A equipe adversária ganha **1 ponto** se acertar a direção correta do alvo em relação ao ponteiro.

Exemplo:

```ts
const realDirection = targetPosition < guessPosition ? "left" : "right";

if (opponentDirectionGuess === realDirection) {
  opponentTeamScore += 1;
}
```

---

## 10. Eventos Socket.IO

### Eventos de Sala

```ts
"room:create"
"room:join"
"room:leave"
"room:error"
```

### Eventos de Lobby

```ts
"player:set-name"
"player:join-team"
"player:leave-team"
"game:start"
```

### Eventos de Rodada

```ts
"round:start"
"psychic:submit-clue"
"team:submit-guess"
"opponent:submit-direction"
"round:reveal"
"round:end"
```

### Eventos de Sincronização

```ts
"game:state"
"player:connected"
"player:disconnected"
```

---

## 11. Responsabilidades do Backend

O backend deve controlar:

- Criação de salas
- Entrada e saída de jogadores
- Times
- Host da sala
- Estado oficial da partida
- Sorteio de cartas
- Sorteio da posição secreta do alvo
- Controle do psíquico
- Recebimento da dica
- Recebimento do palpite
- Recebimento da aposta do adversário
- Cálculo da pontuação
- Mudança de rodada
- Fim da partida

O frontend não deve calcular pontuação oficial sozinho. Ele pode apenas mostrar prévias visuais.

---

## 12. Responsabilidades do Frontend

O frontend deve ter as seguintes telas:

### 12.1 Home

- Nome do jogo
- Regras
- Criar sala
- Entrar em sala

### 12.2 Identificação

- Campo para nome do jogador
- Campo para código da sala

### 12.3 Lobby

- Lista de jogadores conectados
- Código da sala
- Botão para copiar código
- Escolha de time
- Botão para iniciar jogo, disponível apenas para o host

### 12.4 Tela do Jogo

- Carta atual com os dois extremos
- Área da roleta/escala
- Ponteiro móvel para o time ativo
- Visão especial para o psíquico com o alvo secreto
- Campo para enviar dica
- Botões para aposta do adversário: esquerda/direita
- Área de revelação do alvo
- Placar

### 12.5 Fim de Jogo

- Time vencedor
- Pontuação final
- Botão para jogar novamente
- Botão para voltar ao lobby

---

## 13. Componente Visual da Roleta

Para simplificar o MVP, a roleta pode começar como uma escala horizontal de 0 a 100.

Depois, pode ser transformada em um componente circular ou semicircular.

MVP visual sugerido:

```txt
[ Frio ] -------------------------------- [ Quente ]
                         ^
                      ponteiro
```

Quando revelar:

```txt
[ Frio ] -------------------------------- [ Quente ]
                    alvo   ^
                         ponteiro
```

O psíquico deve ver o alvo antes da dica. Os outros jogadores não devem ver.

---

## 14. Validações Importantes

O servidor deve validar:

- Apenas o host pode iniciar o jogo
- Apenas jogadores da sala podem interagir com aquela sala
- Apenas o psíquico pode enviar dica
- O psíquico não deve enviar palpite do time
- Apenas a equipe ativa pode enviar o palpite
- Apenas a equipe adversária pode enviar a direção esquerda/direita
- A rodada só pode ser revelada depois da dica, palpite e aposta adversária
- O jogo termina quando um time alcança 10 pontos

---

## 15. Ordem Recomendada de Implementação

### Etapa 1 — Setup do Projeto

- Criar pasta `client`
- Criar app React com Vite
- Criar pasta `server`
- Configurar Node.js, Express e Socket.IO
- Configurar TypeScript nos dois lados

### Etapa 2 — Home Page

- Criar tela inicial
- Adicionar regras resumidas
- Adicionar botões de criar sala e entrar em sala

### Etapa 3 — Identificação do Jogador

- Criar formulário de nome
- Salvar nome localmente no estado do frontend
- Enviar nome ao backend ao entrar na sala

### Etapa 4 — Criação e Entrada em Salas

- Criar evento `room:create`
- Criar evento `room:join`
- Gerar código curto da sala
- Mostrar jogadores conectados

### Etapa 5 — Lobby

- Mostrar código da sala
- Listar jogadores
- Permitir escolher Time A ou Time B
- Permitir host iniciar a partida

### Etapa 6 — Estado Inicial do Jogo

- Criar estrutura `GameState`
- Criar placar
- Criar controle de time ativo
- Criar controle de rodada

### Etapa 7 — Rodada

- Sortear carta
- Sortear posição secreta do alvo
- Definir psíquico
- Exibir alvo apenas para o psíquico

### Etapa 8 — Dica e Palpite

- Psíquico envia dica
- Time ativo move ponteiro
- Time ativo confirma palpite
- Time adversário escolhe esquerda ou direita

### Etapa 9 — Revelação e Pontuação

- Revelar alvo
- Calcular distância
- Atribuir pontos ao time ativo
- Atribuir possível ponto ao adversário
- Atualizar placar

### Etapa 10 — Fim de Jogo

- Verificar se algum time chegou a 10 pontos
- Mostrar vencedor
- Permitir reiniciar partida

---

## 16. Melhorias Futuras

Depois do MVP, implementar:

- Modo casal sem times grandes
- Cartas personalizadas
- Baralho criado pelo usuário
- Chat da sala
- Histórico de rodadas
- Avatares
- Animação da roleta
- Som de revelação
- Reconexão automática
- Persistência em banco de dados
- Autenticação com Google ou email
- Ranking informal
- Modo privado com senha da sala
- Versão mobile responsiva

---

## 17. Sugestão de Modo Casal

Como o objetivo inicial é jogar com a namorada, pode ser criado um modo simplificado.

### Modo Casal

- Dois jogadores entram na sala
- Um jogador é o psíquico da rodada
- O outro tenta acertar o alvo
- Não existe time adversário
- A pontuação depende apenas da distância do palpite
- Os jogadores alternam o papel de psíquico a cada rodada
- O objetivo ainda pode ser chegar a 10 pontos

Esse modo pode ser mais divertido para duas pessoas e mais fácil de implementar no começo.

---

## 18. Prompt Resumido para o Cursor AI

Use este planejamento para implementar um jogo online chamado **Entre Extremos**, inspirado na mecânica de Wavelength, mas com identidade própria.

Requisitos principais:

1. Criar frontend em React + TypeScript + Tailwind.
2. Criar backend em Node.js + Express + Socket.IO.
3. Implementar home page com regras.
4. Implementar identificação simples de usuário por nome.
5. Implementar criação e entrada em salas por código.
6. Implementar lobby com jogadores e escolha de times.
7. Implementar rodada com carta de extremos, psíquico, alvo secreto, dica, palpite, aposta esquerda/direita e revelação.
8. Implementar pontuação até 10 pontos.
9. O backend deve controlar o estado oficial do jogo.
10. O frontend deve apenas exibir o estado e enviar ações dos usuários.

Comece pelo MVP funcional, com visual simples, usando escala horizontal de 0 a 100 no lugar da roleta circular. Depois o componente visual pode ser melhorado.

