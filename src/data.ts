import type { StudyState, SubjectId, SubjectMeta, TopicDefinition, WeekDay } from "./types";

export const SUBJECT_META: Record<SubjectId, SubjectMeta> = {
  matematica: { name: "Matemática", color: "#58d9e8", tag: "exatas" },
  fisica: { name: "Física", color: "#f3b24f", tag: "exatas" },
  quimica: { name: "Química", color: "#c48dff", tag: "exatas" },
  redacao: { name: "Redação", color: "#59d58f", tag: "linguagens" },
  portugues: { name: "Português / Literatura", color: "#7aa7ff", tag: "linguagens" },
  ingles: { name: "Inglês", color: "#f08f98", tag: "linguagens" },
  humanas: { name: "Humanas", color: "#9ca8bf", tag: "humanas" },
};

export const SUBJECT_ORDER: SubjectId[] = [
  "matematica",
  "fisica",
  "quimica",
  "redacao",
  "portugues",
  "ingles",
  "humanas",
];

export const TOPICS: Record<SubjectId, TopicDefinition[]> = {
  matematica: [
    { id: "m01", name: "Conjuntos e conjuntos numéricos" },
    { id: "m02", name: "Razão, proporção e porcentagem" },
    { id: "m03", name: "Funções afim e quadrática" },
    { id: "m04", name: "Função exponencial e logarítmica" },
    { id: "m05", name: "Progressões (PA e PG)" },
    { id: "m06", name: "Trigonometria no triângulo retângulo" },
    { id: "m07", name: "Trigonometria, ciclo e funções trigonométricas" },
    { id: "m08", name: "Matrizes e determinantes" },
    { id: "m09", name: "Sistemas lineares" },
    { id: "m10", name: "Geometria plana" },
    { id: "m11", name: "Geometria espacial" },
    { id: "m12", name: "Geometria analítica" },
    { id: "m13", name: "Análise combinatória" },
    { id: "m14", name: "Probabilidade" },
    { id: "m15", name: "Estatística" },
    { id: "m16", name: "Números complexos" },
    { id: "m17", name: "Polinômios e equações algébricas" },
  ],
  fisica: [
    { id: "f01", name: "Cinemática escalar e vetorial" },
    { id: "f02", name: "Dinâmica e Leis de Newton" },
    { id: "f03", name: "Trabalho, energia e potência" },
    { id: "f04", name: "Impulso e quantidade de movimento" },
    { id: "f05", name: "Estática e Hidrostática" },
    { id: "f06", name: "Gravitação" },
    { id: "f07", name: "Termometria e dilatação" },
    { id: "f08", name: "Calorimetria e mudanças de estado" },
    { id: "f09", name: "Termodinâmica" },
    { id: "f10", name: "Óptica geométrica" },
    { id: "f11", name: "Ondulatória" },
    { id: "f12", name: "Eletrostática" },
    { id: "f13", name: "Eletrodinâmica e circuitos" },
    { id: "f14", name: "Eletromagnetismo" },
    { id: "f15", name: "Física moderna" },
  ],
  quimica: [
    { id: "q01", name: "Modelos atômicos e tabela periódica" },
    { id: "q02", name: "Ligações químicas" },
    { id: "q03", name: "Funções inorgânicas" },
    { id: "q04", name: "Estequiometria" },
    { id: "q05", name: "Soluções" },
    { id: "q06", name: "Termoquímica" },
    { id: "q07", name: "Cinética química" },
    { id: "q08", name: "Equilíbrio químico" },
    { id: "q09", name: "Eletroquímica" },
    { id: "q10", name: "Química orgânica" },
    { id: "q11", name: "Isomeria e reações orgânicas" },
  ],
  redacao: [
    { id: "r01", name: "Estrutura dissertativo-argumentativa" },
    { id: "r02", name: "Repertório sociocultural" },
    { id: "r03", name: "Coesão e coerência" },
    { id: "r04", name: "Proposta de intervenção" },
    { id: "r05", name: "Prática cronometrada e autocorreção" },
  ],
  portugues: [
    { id: "p01", name: "Interpretação de texto" },
    { id: "p02", name: "Gramática essencial" },
    { id: "p03", name: "Literatura e escolas literárias" },
    { id: "p04", name: "Figuras de linguagem e variação linguística" },
  ],
  ingles: [
    { id: "i01", name: "Leitura e interpretação em inglês" },
    { id: "i02", name: "Vocabulário e falsos cognatos" },
    { id: "i03", name: "Estrutura gramatical básica" },
  ],
  humanas: [
    { id: "h01", name: "História do Brasil" },
    { id: "h02", name: "Geografia: ambiente e geopolítica" },
    { id: "h03", name: "Filosofia e Sociologia" },
    { id: "h04", name: "Atualidades" },
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
    humanas: 5,
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
