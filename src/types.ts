export type SubjectId =
  | "matematica"
  | "fisica"
  | "quimica"
  | "redacao"
  | "portugues"
  | "ingles"
  | "historia"
  | "geografia"
  | "filosofia"
  | "sociologia"
  | "biologia"
  | "atualidades";

export type TopicStatus = "novo" | "estudando" | "revisar" | "dominado";
export type WeekDay = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface SubjectMeta {
  name: string;
  color: string;
  tag: string;
}

export interface TopicDefinition {
  id: string;
  name: string;
}

export interface SessionEntry {
  date: string;
  subject: SubjectId;
  minutes: number;
}

export interface ReviewEntry {
  id: string;
  topicId: string;
  topicName: string;
  subject: SubjectId;
  stage: number;
  dueDate: string;
}

export interface SimuladoEntry {
  id: string;
  date: string;
  tipo: string;
  area: string;
  nota: number;
}

export interface StudyState {
  weights: Record<SubjectId, number>;
  days: WeekDay[];
  hoursPerDay: number;
  statusMap: Record<string, TopicStatus>;
  sessions: SessionEntry[];
  reviews: ReviewEntry[];
  simulados: SimuladoEntry[];
  startDate: string;
}

export interface ScheduleBlock {
  subject: SubjectId;
  hours: number;
}
