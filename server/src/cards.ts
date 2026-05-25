import {
  CARD_THEME_OPTIONS,
  DEFAULT_CARD_THEMES,
  type CardTheme,
  type ExtremeCard,
} from "@entre-extremos/shared";

type CardPair = Omit<ExtremeCard, "id">;
type ThemedCard = ExtremeCard & { theme: CardTheme };

export const CARD_DECKS: Record<CardTheme, CardPair[]> = {
  relacionamento: [
    { left: "Traição", right: "Não traição" },
    { left: "Red flag", right: "Green flag" },
    { left: "Fofo", right: "Grudento" },
    { left: "Romântico", right: "Brega" },
    { left: "Ciúme saudável", right: "Ciúme problemático" },
    { left: "Flerte inocente", right: "Flerte suspeito" },
    { left: "Atitude de solteiro", right: "Atitude de casado" },
    { left: "Pedido fofo", right: "Pedido constrangedor" },
    { left: "Surpresa boa", right: "Surpresa péssima" },
    { left: "Sumiço aceitável", right: "Sumiço imperdoável" },
    { left: "Mensagem normal", right: "Mensagem suspeita" },
    { left: "Amizade tranquila", right: "Amizade perigosa" },
    { left: "Ex tranquilo", right: "Ex problema" },
    { left: "Declaração bonita", right: "Declaração vergonhosa" },
    { left: "Perdoável", right: "Imperdoável" },
    { left: "Coisa que eu perdoaria", right: "Coisa que eu terminaria" },
    { left: "Bonito no começo", right: "Irritante depois" },
    { left: "Pessoa para casar", right: "Pessoa para bloquear" },
    { left: "Atitude charmosa", right: "Atitude vergonha alheia" },
    { left: "Coisa que parece traição", right: "Coisa que não é nada" },
    { left: "Date dos sonhos", right: "Date traumático" },
    { left: "Amor da vida", right: "Contatinho duvidoso" },
    { left: "Pessoa madura", right: "Pessoa problemática" },
    { left: "Sinal de amor", right: "Sinal de golpe" },
  ],
  pets: [
    { left: "Pior pet", right: "Melhor pet" },
    { left: "Pet de apartamento", right: "Pet de fazenda" },
    { left: "Fofo", right: "Assustador" },
    { left: "Fácil de cuidar", right: "Impossível de cuidar" },
    { left: "Pet carente", right: "Pet independente" },
    { left: "Pet chique", right: "Pet raiz" },
    { left: "Pet silencioso", right: "Pet barulhento" },
    { left: "Pet de vó", right: "Pet de jovem" },
    { left: "Pet que dá trabalho", right: "Pet que compensa o trabalho" },
    { left: "Animal confiável", right: "Animal traiçoeiro" },
  ],
  personalidade: [
    { left: "Confiante", right: "Arrogante" },
    { left: "Engraçado", right: "Sem noção" },
    { left: "Sincero", right: "Grosso" },
    { left: "Misterioso", right: "Esquisito" },
    { left: "Educado", right: "Falso" },
    { left: "Intenso", right: "Desesperado" },
    { left: "Calmo", right: "Sem atitude" },
    { left: "Protetor", right: "Controlador" },
    { left: "Charmoso", right: "Forçado" },
    { left: "Corajoso", right: "Imprudente" },
    { left: "Independente", right: "Frio" },
    { left: "Carinhoso", right: "Carente demais" },
  ],
  signos: [
    { left: "Signo tranquilo", right: "Signo surtado" },
    { left: "Signo fiel", right: "Signo enrolado" },
    { left: "Signo romântico", right: "Signo frio" },
    { left: "Signo caseiro", right: "Signo rolezeiro" },
    { left: "Signo organizado", right: "Signo bagunceiro" },
    { left: "Signo racional", right: "Signo emocionado" },
    { left: "Signo discreto", right: "Signo dramático" },
    { left: "Signo confiável", right: "Signo caótico" },
    { left: "Signo paz e amor", right: "Signo vingativo" },
    { left: "Signo fácil de lidar", right: "Signo difícil de lidar" },
  ],
  viagem: [
    { left: "Lugar ruim para viagem", right: "Lugar perfeito para viagem" },
    { left: "Viagem barata", right: "Viagem cara" },
    { left: "Viagem relaxante", right: "Viagem cansativa" },
    { left: "Destino romântico", right: "Destino sem graça" },
    { left: "Lugar de casal", right: "Lugar de solteiro" },
    { left: "Lugar instagramável", right: "Lugar decepcionante" },
    { left: "Lugar seguro", right: "Lugar perigoso" },
    { left: "Viagem de aventura", right: "Viagem de descanso" },
    { left: "Viagem chique", right: "Viagem perrengue" },
    { left: "Lugar para ir uma vez", right: "Lugar para voltar sempre" },
    { left: "Destino superestimado", right: "Destino subestimado" },
  ],
  "primeiro-encontro": [
    { left: "Lugar péssimo para primeiro encontro", right: "Lugar perfeito para primeiro encontro" },
    { left: "Encontro romântico", right: "Encontro estranho" },
    { left: "Lugar confortável", right: "Lugar constrangedor" },
    { left: "Lugar barato", right: "Lugar caro demais" },
    { left: "Lugar tranquilo", right: "Lugar barulhento" },
    { left: "Lugar criativo", right: "Lugar forçado" },
    { left: "Lugar seguro", right: "Lugar arriscado" },
    { left: "Primeiro encontro memorável", right: "Primeiro encontro esquecível" },
    { left: "Lugar bom para conversar", right: "Lugar impossível de conversar" },
    { left: "Date fofo", right: "Date caótico" },
  ],
  comida: [
    { left: "Comida ruim", right: "Comida perfeita" },
    { left: "Comida de criança", right: "Comida de adulto" },
    { left: "Comida barata", right: "Comida cara" },
    { left: "Comida humilde", right: "Comida de rico" },
    { left: "Comida normal", right: "Comida vergonhosa" },
    { left: "Lanche de madrugada", right: "Jantar chique" },
  ],
  "filmes-series": [
    { left: "Filme péssimo", right: "Filme perfeito" },
    { left: "Série para abandonar", right: "Série para maratonar" },
    { left: "Personagem herói", right: "Personagem vilão" },
    { left: "Final decepcionante", right: "Final perfeito" },
    { left: "Cena vergonha alheia", right: "Cena icônica" },
    { left: "Música insuportável", right: "Música perfeita" },
  ],
  profissoes: [
    { left: "Profissão chata", right: "Profissão dos sonhos" },
    { left: "Trabalho tranquilo", right: "Trabalho estressante" },
    { left: "Profissão mal paga", right: "Profissão milionária" },
    { left: "Profissão normal", right: "Profissão curiosa" },
    { left: "Chefe tranquilo", right: "Chefe insuportável" },
  ],
  lugares: [
    { left: "Cidade ruim para morar", right: "Cidade perfeita para morar" },
    { left: "Lugar calmo", right: "Lugar caótico" },
    { left: "Lugar seguro", right: "Lugar perigoso" },
    { left: "Lugar superestimado", right: "Lugar subestimado" },
    { left: "Lugar de pobre", right: "Lugar de rico" },
    { left: "Lugar normal", right: "Lugar vergonhoso" },
  ],
  aleatorias: [
    { left: "Frio", right: "Quente" },
    { left: "Feio", right: "Bonito" },
    { left: "Barato", right: "Caro" },
    { left: "Normal", right: "Estranho" },
    { left: "Chato", right: "Divertido" },
    { left: "Fácil", right: "Difícil" },
    { left: "Infantil", right: "Adulto" },
    { left: "Comum", right: "Raro" },
    { left: "Calmo", right: "Caótico" },
    { left: "Seguro", right: "Perigoso" },
    { left: "Objeto inútil", right: "Objeto essencial" },
    { left: "Pessoa confiável", right: "Pessoa suspeita" },
    { left: "Festa flopada", right: "Festa lendária" },
    { left: "Roupa ridícula", right: "Roupa estilosa" },
    { left: "Carro de pobre", right: "Carro de rico" },
    { left: "App inútil", right: "App indispensável" },
    { left: "Boa ideia", right: "Péssima ideia" },
  ],
};

const CARD_THEME_IDS = CARD_THEME_OPTIONS.map((theme) => theme.id);

export function normalizeCardThemes(themes?: CardTheme[]): CardTheme[] {
  if (!themes?.length) return [...DEFAULT_CARD_THEMES];

  const uniqueThemes = themes.filter(
    (theme, index): theme is CardTheme =>
      CARD_THEME_IDS.includes(theme) && themes.indexOf(theme) === index
  );

  return uniqueThemes.length > 0 ? uniqueThemes : [...DEFAULT_CARD_THEMES];
}

function cardsForThemes(themes: CardTheme[]): ThemedCard[] {
  return themes.flatMap((theme) =>
    CARD_DECKS[theme].map((card, index) => ({
      ...card,
      id: `${theme}-${index + 1}`,
      theme,
    }))
  );
}

export const CARDS: ThemedCard[] = cardsForThemes([...CARD_THEME_IDS]);

export function pickRandomCard(usedCardIds: string[], themes?: CardTheme[]): ExtremeCard {
  const selectedThemes = normalizeCardThemes(themes);
  const cards = cardsForThemes(selectedThemes);
  const available = cards.filter((card) => !usedCardIds.includes(card.id));
  const pool = available.length > 0 ? available : cards;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomTargetPosition(): number {
  return Math.floor(Math.random() * 101);
}
