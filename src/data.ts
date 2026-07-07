import type { StudyState, SubjectId, SubjectMeta, TopicDefinition, WeekDay } from "./types";

export const SUBJECT_META: Record<SubjectId, SubjectMeta> = {
  matematica: {
    name: "Matemática",
    color: "#2563EB", // Azul
    tag: "exatas",
  },
  fisica: {
    name: "Física",
    color: "#F59E0B", // Âmbar
    tag: "exatas",
  },
  quimica: {
    name: "Química",
    color: "#10B981", // Verde
    tag: "exatas",
  },
  redacao: {
    name: "Redação",
    color: "#EC4899", // Rosa
    tag: "linguagens",
  },
  portugues: {
    name: "Português / Literatura",
    color: "#8B5CF6", // Roxo
    tag: "linguagens",
  },
  ingles: {
    name: "Inglês",
    color: "#06B6D4", // Ciano
    tag: "linguagens",
  },
  historia: {
    name: "História",
    color: "#B45309", // Marrom
    tag: "humanas",
  },
  geografia: {
    name: "Geografia",
    color: "#16A34A", // Verde escuro
    tag: "humanas",
  },
  filosofia: {
    name: "Filosofia",
    color: "#7C3AED", // Roxo profundo
    tag: "humanas",
  },
  sociologia: {
    name: "Sociologia",
    color: "#64748B", // Cinza azulado
    tag: "humanas",
  },
  atualidades: {
    name: "Atualidades",
    color: "#EF4444", // Vermelho
    tag: "humanas",
  },
};

export const SUBJECT_ORDER: SubjectId[] = [
  "matematica",
  "fisica",
  "quimica",
  "redacao",
  "portugues",
  "ingles",
  "historia",
  "geografia",
  "filosofia",
  "sociologia",
  "atualidades",
];

export const TOPICS: Record<SubjectId, TopicDefinition[]> = {
  matematica: [
    { id: "m01", name: "Conjuntos e conjuntos numéricos" },
    { id: "m02", name: "Razão, proporção e porcentagem" },
    { id: "m03", name: "Regra de três simples e composta" },
    { id: "m04", name: "Funções: conceitos e função afim" },
    { id: "m05", name: "Função quadrática" },
    { id: "m06", name: "Função modular" },
    { id: "m07", name: "Função exponencial" },
    { id: "m08", name: "Função logarítmica" },
    { id: "m09", name: "Progressões (PA e PG)" },
    { id: "m10", name: "Matemática financeira (juros simples e compostos)" },
    { id: "m11", name: "Trigonometria no triângulo retângulo" },
    { id: "m12", name: "Trigonometria no ciclo e funções trigonométricas" },
    { id: "m13", name: "Matrizes e determinantes" },
    { id: "m14", name: "Sistemas lineares" },
    { id: "m15", name: "Geometria plana" },
    { id: "m16", name: "Geometria espacial" },
    { id: "m17", name: "Geometria analítica" },
    { id: "m18", name: "Análise combinatória" },
    { id: "m19", name: "Probabilidade" },
    { id: "m20", name: "Estatística" },
    { id: "m21", name: "Números complexos" },
    { id: "m22", name: "Polinômios e equações algébricas" },
  ],
  fisica: [
    { id: "f01", name: "Introdução à física e notação científica" },
    { id: "f02", name: "Cinemática escalar" },
    { id: "f03", name: "Cinemática vetorial e movimento circular" },
    { id: "f04", name: "Dinâmica e Leis de Newton" },
    { id: "f05", name: "Atrito e plano inclinado" },
    { id: "f06", name: "Trabalho, energia e potência" },
    { id: "f07", name: "Impulso e quantidade de movimento" },
    { id: "f08", name: "Estática" },
    { id: "f09", name: "Hidrostática" },
    { id: "f10", name: "Gravitação" },
    { id: "f11", name: "Termometria e dilatação" },
    { id: "f12", name: "Calorimetria e mudanças de estado" },
    { id: "f13", name: "Termodinâmica" },
    { id: "f14", name: "Óptica geométrica" },
    { id: "f15", name: "Ondulatória" },
    { id: "f16", name: "Eletrostática" },
    { id: "f17", name: "Eletrodinâmica e circuitos" },
    { id: "f18", name: "Eletromagnetismo" },
    { id: "f19", name: "Física moderna" },
  ],
  quimica: [
    { id: "q01", name: "Introdução à química e estados da matéria" },
    { id: "q02", name: "Modelos atômicos e tabela periódica" },
    { id: "q03", name: "Ligações químicas" },
    { id: "q04", name: "Geometria molecular e polaridade" },
    { id: "q05", name: "Funções inorgânicas" },
    { id: "q06", name: "Reações químicas e balanceamento" },
    { id: "q07", name: "Estequiometria" },
    { id: "q08", name: "Soluções" },
    { id: "q09", name: "Termoquímica" },
    { id: "q10", name: "Cinética química" },
    { id: "q11", name: "Equilíbrio químico" },
    { id: "q12", name: "Eletroquímica" },
    { id: "q13", name: "Radioatividade" },
    { id: "q14", name: "Química orgânica: introdução e hidrocarbonetos" },
    { id: "q15", name: "Funções orgânicas" },
    { id: "q16", name: "Isomeria e reações orgânicas" },
    { id: "q17", name: "Polímeros e bioquímica" },
  ],
  redacao: [
    { id: "r01", name: "Estrutura dissertativo-argumentativa" },
    { id: "r02", name: "Leitura e interpretação da coletânea" },
    { id: "r03", name: "Repertório sociocultural" },
    { id: "r04", name: "Argumentação, coesão e coerência" },
    { id: "r05", name: "Proposta de intervenção" },
    { id: "r06", name: "Prática cronometrada e autocorreção" },
  ],
  portugues: [
    { id: "p01", name: "Interpretação de texto" },
    { id: "p02", name: "Ortografia e acentuação" },
    { id: "p03", name: "Morfologia (classes de palavras)" },
    { id: "p04", name: "Sintaxe: termos da oração" },
    { id: "p05", name: "Sintaxe: período composto" },
    { id: "p06", name: "Concordância e regência" },
    { id: "p07", name: "Figuras de linguagem e variação linguística" },
    { id: "p08", name: "Literatura e escolas literárias" },
    { id: "p09", name: "Gêneros textuais e literários" },
  ],
  ingles: [
    { id: "i01", name: "Vocabulário básico e falsos cognatos" },
    { id: "i02", name: "Estrutura gramatical básica (tempos verbais)" },
    { id: "i03", name: "Leitura e interpretação em inglês" },
    { id: "i04", name: "Estratégias de leitura (skimming e scanning)" },
  ],
  historia: [
    { id: "h01", name: "Pré-história e civilizações antigas" },
    { id: "h02", name: "Antiguidade Clássica: Grécia e Roma" },
    { id: "h03", name: "Idade Média: feudalismo e sociedade medieval" },
    { id: "h04", name: "Renascimento e Reformas religiosas" },
    { id: "h05", name: "Absolutismo e Iluminismo" },
    { id: "h06", name: "Revoluções burguesas (Inglesa, Americana, Francesa)" },
    { id: "h07", name: "Revolução Industrial" },
    { id: "h08", name: "Brasil Colônia: colonização e economia açucareira" },
    { id: "h09", name: "Brasil Colônia: mineração e crise do sistema colonial" },
    { id: "h10", name: "Independência do Brasil e Primeiro Reinado" },
    { id: "h11", name: "Segundo Reinado e escravidão" },
    { id: "h12", name: "Proclamação da República e República Velha" },
    { id: "h13", name: "Era Vargas" },
    { id: "h14", name: "Guerras Mundiais e Guerra Fria" },
    { id: "h15", name: "Descolonização afro-asiática" },
    { id: "h16", name: "Ditadura Militar no Brasil" },
    { id: "h17", name: "Nova República e redemocratização" },
  ],
  geografia: [
    { id: "g01", name: "Introdução à geografia e cartografia" },
    { id: "g02", name: "Geografia física: relevo, clima e vegetação" },
    { id: "g03", name: "Hidrografia e biomas brasileiros" },
    { id: "g04", name: "Geografia da população e demografia" },
    { id: "g05", name: "Urbanização e êxodo rural" },
    { id: "g06", name: "Geografia agrária e questão agrária no Brasil" },
    { id: "g07", name: "Industrialização e matriz energética" },
    { id: "g08", name: "Geopolítica e globalização" },
    { id: "g09", name: "Blocos econômicos e nova ordem mundial" },
    { id: "g10", name: "Meio ambiente e sustentabilidade" },
    { id: "g11", name: "Conflitos internacionais contemporâneos" },
  ],
  filosofia: [
    { id: "fl01", name: "Origem da filosofia e pré-socráticos" },
    { id: "fl02", name: "Sócrates, Platão e Aristóteles" },
    { id: "fl03", name: "Filosofia medieval: patrística e escolástica" },
    { id: "fl04", name: "Filosofia moderna: racionalismo e empirismo" },
    { id: "fl05", name: "Iluminismo e contratualismo (Hobbes, Locke, Rousseau)" },
    { id: "fl06", name: "Idealismo alemão (Kant e Hegel)" },
    { id: "fl07", name: "Filosofia contemporânea: existencialismo e marxismo" },
    { id: "fl08", name: "Ética e filosofia política" },
  ],
  sociologia: [
    { id: "so01", name: "Surgimento da sociologia (Durkheim, Marx, Weber)" },
    { id: "so02", name: "Cultura, socialização e identidade" },
    { id: "so03", name: "Estratificação social e desigualdade" },
    { id: "so04", name: "Trabalho e mudanças no mundo do trabalho" },
    { id: "so05", name: "Movimentos sociais e cidadania" },
    { id: "so06", name: "Sociologia brasileira e questões contemporâneas" },
  ],
  atualidades: [
    { id: "at01", name: "Política nacional e internacional contemporânea" },
    { id: "at02", name: "Meio ambiente e mudanças climáticas" },
    { id: "at03", name: "Tecnologia, redes sociais e desinformação" },
    { id: "at04", name: "Direitos humanos e questões sociais contemporâneas" },
    { id: "at05", name: "Economia global e conjuntura atual" },
  ],
};

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};

export const REVIEW_OFFSETS = [1, 3, 7, 16, 35];

export const TARGET_DATES = {
  enemDay1: "2026-11-08",
  enemDay2: "2026-11-15",
  inatelEstimate: "2026-11-29",
};

export const DEFAULT_STATE: StudyState = {
  weights: {
    matematica: 28,
    fisica: 24,
    quimica: 12,
    redacao: 16,
    portugues: 10,
    ingles: 5,
    historia: 2,
    geografia: 1,
    filosofia: 1,
    sociologia: 1,
    atualidades: 1,
  },
  days: ["seg", "ter", "qua", "qui", "sex", "sab"],
  hoursPerDay: 4,
  statusMap: {},
  sessions: [],
  reviews: [],
  simulados: [],
  startDate: "",
};

export function createFreshState(today: string): StudyState {
  return {
    ...DEFAULT_STATE,
    startDate: today,
  };
}
