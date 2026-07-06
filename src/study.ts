import { DEFAULT_STATE, REVIEW_OFFSETS, SUBJECT_ORDER, SUBJECT_META, TOPICS } from "./data";
import type { ReviewEntry, ScheduleBlock, StudyState, SubjectId, TopicStatus, WeekDay } from "./types";

export const TOPIC_STATUS_ORDER: TopicStatus[] = ["novo", "revisar", "dominado"];

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("pt-BR", options);
}

export function formatLongDate(dateKey: string) {
  return formatDate(dateKey, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export function daysBetween(startKey: string, endKey: string) {
  const start = new Date(`${startKey}T12:00:00`).getTime();
  const end = new Date(`${endKey}T12:00:00`).getTime();
  return Math.round((end - start) / 86400000);
}

export function weekBounds(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [todayKey(monday), todayKey(sunday)] as const;
}

export function createUid() {
  return Math.random().toString(36).slice(2, 10);
}

export function listTopics() {
  return SUBJECT_ORDER.flatMap((subject) =>
    TOPICS[subject].map((topic) => ({
      ...topic,
      subject,
    })),
  );
}

export function progressBySubject(state: StudyState, subject: SubjectId) {
  const total = TOPICS[subject].length;
  const mastered = TOPICS[subject].filter((topic) => state.statusMap[topic.id] === "dominado").length;
  return total === 0 ? 0 : Math.round((mastered / total) * 100);
}

export function subjectReviewProgress(state: StudyState, subject: SubjectId) {
  const total = TOPICS[subject].length;
  const tracked = TOPICS[subject].filter((topic) => state.statusMap[topic.id] && state.statusMap[topic.id] !== "novo").length;
  return total === 0 ? 0 : Math.round((tracked / total) * 100);
}

export function computeSchedule(state: StudyState): Record<WeekDay, ScheduleBlock[]> {
  const schedule = Object.fromEntries(state.days.map((day) => [day, [] as ScheduleBlock[]])) as Record<
    WeekDay,
    ScheduleBlock[]
  >;
  const weeklyHours = state.hoursPerDay * state.days.length;
  const remaining = Object.fromEntries(
    SUBJECT_ORDER.map((subject) => [subject, weeklyHours * (state.weights[subject] / 100)]),
  ) as Record<SubjectId, number>;

  for (const day of state.days) {
    let remainingDay = state.hoursPerDay;
    let guard = 0;
    while (remainingDay > 0.16 && guard < 40) {
      guard += 1;
      const ordered = SUBJECT_ORDER.filter((subject) => remaining[subject] > 0.16).sort(
        (a, b) => remaining[b] - remaining[a],
      );
      if (ordered.length === 0) {
        break;
      }

      const selected = ordered[0];
      const blockHours = Math.min(1.5, remaining[selected], remainingDay);
      schedule[day].push({ subject: selected, hours: Math.round(blockHours * 4) / 4 });
      remaining[selected] -= blockHours;
      remainingDay -= blockHours;
    }
  }

  return schedule;
}

export function reviewChainForTopic(topicId: string, topicName: string, subject: SubjectId): ReviewEntry {
  const due = new Date();
  due.setDate(due.getDate() + REVIEW_OFFSETS[0]);
  return {
    id: createUid(),
    topicId,
    topicName,
    subject,
    stage: 0,
    dueDate: todayKey(due),
  };
}

export function advanceReview(review: ReviewEntry) {
  const nextStage = review.stage + 1;
  if (nextStage >= REVIEW_OFFSETS.length) {
    return null;
  }

  const due = new Date();
  due.setDate(due.getDate() + REVIEW_OFFSETS[nextStage]);
  return {
    ...review,
    stage: nextStage,
    dueDate: todayKey(due),
  };
}

export function nextTopicStatus(current: TopicStatus): TopicStatus {
  const index = TOPIC_STATUS_ORDER.indexOf(current);
  return TOPIC_STATUS_ORDER[(index + 1) % TOPIC_STATUS_ORDER.length];
}

export function updateTopicStatus(
  state: StudyState,
  topicId: string,
  topicName: string,
  subject: SubjectId,
  nextStatus: TopicStatus,
): StudyState {
  const nextState: StudyState = {
    ...state,
    statusMap: {
      ...state.statusMap,
      [topicId]: nextStatus,
    },
  };

  if (nextStatus === "dominado") {
    const alreadyTracked = nextState.reviews.some((review) => review.topicId === topicId);
    if (!alreadyTracked) {
      nextState.reviews = [...nextState.reviews, reviewChainForTopic(topicId, topicName, subject)];
    }
    return nextState;
  }

  nextState.reviews = nextState.reviews.filter((review) => review.topicId !== topicId);
  return nextState;
}

export function markReviewDone(state: StudyState, reviewId: string) {
  const review = state.reviews.find((item) => item.id === reviewId);
  if (!review) {
    return state;
  }

  const advanced = advanceReview(review);
  return {
    ...state,
    reviews: advanced
      ? state.reviews.map((item) => (item.id === reviewId ? advanced : item))
      : state.reviews.filter((item) => item.id !== reviewId),
  };
}

export function summaryStats(state: StudyState, today = todayKey()) {
  const [weekStart, weekEnd] = weekBounds(today);
  const weekSessions = state.sessions.filter((session) => session.date >= weekStart && session.date <= weekEnd);
  const totalWeekMinutes = weekSessions.reduce((sum, session) => sum + session.minutes, 0);
  const totalMinutes = state.sessions.reduce((sum, session) => sum + session.minutes, 0);
  const pendingReviews = state.reviews.filter((review) => review.dueDate <= today).length;

  const daysWithStudy = new Set(state.sessions.map((session) => session.date));
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  while (daysWithStudy.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const bySubject = SUBJECT_ORDER.reduce<Record<SubjectId, number>>((acc, subject) => {
    acc[subject] = 0;
    return acc;
  }, {} as Record<SubjectId, number>);

  for (const session of weekSessions) {
    bySubject[session.subject] += session.minutes;
  }

  return {
    weekStart,
    weekEnd,
    weekSessions,
    totalWeekMinutes,
    totalMinutes,
    pendingReviews,
    streak,
    bySubject,
    targetWeekMinutes: state.hoursPerDay * state.days.length * 60,
  };
}

export function ensureStateShape(state: Partial<StudyState>): StudyState {
  return {
    ...DEFAULT_STATE,
    ...state,
    weights: { ...DEFAULT_STATE.weights, ...(state.weights ?? {}) },
    days: state.days?.length ? state.days : DEFAULT_STATE.days,
    hoursPerDay: typeof state.hoursPerDay === "number" ? state.hoursPerDay : DEFAULT_STATE.hoursPerDay,
    statusMap: state.statusMap ?? {},
    sessions: state.sessions ?? [],
    reviews: state.reviews ?? [],
    simulados: state.simulados ?? [],
    startDate: state.startDate ?? "",
  };
}
