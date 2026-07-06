import { useEffect, useMemo, useState } from "react";
import {
  SUBJECT_META,
  SUBJECT_ORDER,
  REVIEW_OFFSETS,
  TARGET_DATES,
  TOPICS,
  WEEKDAY_LABELS,
  createFreshState,
} from "./data";
import {
  computeSchedule,
  formatDate,
  formatLongDate,
  markReviewDone,
  nextTopicStatus,
  progressBySubject,
  summaryStats,
  todayKey,
  updateTopicStatus,
  subjectReviewProgress,
} from "./study";
import { usePersistentState } from "./storage";
import type { ReviewEntry, SimuladoEntry, StudyState, SubjectId, WeekDay } from "./types";

const APP_STORAGE_KEY = "studyplan-state-v1";
const TAB_ITEMS = [
  { key: "hoje", label: "Hoje" },
  { key: "cronograma", label: "Cronograma" },
  { key: "trilha", label: "Trilha" },
  { key: "revisao", label: "Revisao" },
  { key: "simulados", label: "Simulados" },
  { key: "ajustes", label: "Ajustes" },
] as const;
type TabKey = (typeof TAB_ITEMS)[number]["key"];

type TimerPhase = "focus" | "break";

interface TimerState {
  subject: SubjectId;
  phase: TimerPhase;
  focusMinutes: number;
  breakMinutes: number;
  remainingSeconds: number;
  running: boolean;
  completedCycles: number;
}

const WEEKDAY_SEQUENCE: WeekDay[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

function clampWeight(value: number) {
  return Math.max(0, Math.min(60, value));
}

function clampMinutes(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function topicStatusLabel(status: string) {
  switch (status) {
    case "revisar":
      return "Revisar";
    case "dominado":
      return "Dominei";
    case "estudando":
      return "Estudar";
    default:
      return "Estudar";
  }
}

function toWeekDay(date = new Date()): WeekDay {
  return WEEKDAY_SEQUENCE[date.getDay()];
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatStudyTime(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}min`;
}

function formatStudyMinutes(totalMinutes: number) {
  return formatStudyTime(totalMinutes / 60);
}

function getNextTopicName(state: StudyState, subject: SubjectId) {
  return TOPICS[subject].find((topic) => state.statusMap[topic.id] !== "dominado")?.name ?? TOPICS[subject][0]?.name ?? "";
}

function getTopWeightedSubject(state: StudyState) {
  return [...SUBJECT_ORDER].sort((a, b) => state.weights[b] - state.weights[a])[0];
}

function getSuggestedStudy(state: StudyState, schedule: ReturnType<typeof computeSchedule>, dueReviews: ReviewEntry[], todayWeekday: WeekDay) {
  const todaysBlocks = schedule[todayWeekday] ?? [];
  const firstDueReview = state.reviews
    .filter((review) => review.dueDate <= todayKey())
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];
  const firstScheduledBlock = todaysBlocks[0];
  const subject = firstDueReview?.subject ?? firstScheduledBlock?.subject ?? getTopWeightedSubject(state);
  const reason = firstDueReview
    ? "Tem revisao vencendo hoje"
    : firstScheduledBlock
      ? "Primeiro bloco do cronograma de hoje"
      : "Maior peso no seu cronograma";
  const topic = firstDueReview?.topicName ?? getNextTopicName(state, subject);

  return { subject, reason, topic, todaysBlocks };
}

function App() {
  const [state, setState] = usePersistentState<StudyState>(APP_STORAGE_KEY, createFreshState(todayKey()));
  const [tab, setTab] = useState<TabKey>("hoje");
  const today = todayKey();
  const todayWeekday = toWeekDay();
  const stats = useMemo(() => summaryStats(state, today), [state, today]);
  const schedule = useMemo(() => computeSchedule(state), [state]);
  const simulados = useMemo(() => [...state.simulados].sort((a, b) => (a.date < b.date ? 1 : -1)), [state.simulados]);
  const dueReviews = useMemo(
    () => state.reviews.filter((review) => review.dueDate <= today).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)),
    [state.reviews, today],
  );
  const upcomingReviews = useMemo(
    () =>
      state.reviews
        .filter((review) => review.dueDate > today)
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
        .slice(0, 10),
    [state.reviews, today],
  );
  const suggested = useMemo(() => getSuggestedStudy(state, schedule, dueReviews, todayWeekday), [state, schedule, dueReviews, todayWeekday]);
  const [timer, setTimer] = useState<TimerState>(() => ({
    subject: suggested.subject,
    phase: "focus",
    focusMinutes: 25,
    breakMinutes: 5,
    remainingSeconds: 25 * 60,
    running: false,
    completedCycles: 0,
  }));

  useEffect(() => {
    if (!timer.running) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimer((current) => {
        if (!current.running) {
          return current;
        }

        if (current.remainingSeconds > 1) {
          return {
            ...current,
            remainingSeconds: current.remainingSeconds - 1,
          };
        }

        if (current.phase === "focus") {
          setState((prev) => ({
            ...prev,
            sessions: [...prev.sessions, { date: today, subject: current.subject, minutes: current.focusMinutes }],
          }));

          return {
            ...current,
            phase: "break",
            running: false,
            remainingSeconds: current.breakMinutes * 60,
            completedCycles: current.completedCycles + 1,
          };
        }

        return {
          ...current,
          phase: "focus",
          running: false,
          remainingSeconds: current.focusMinutes * 60,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [setState, today, timer.running]);

  const totalWeight = SUBJECT_ORDER.reduce((sum, subject) => sum + state.weights[subject], 0);
  const currentPhaseMinutes = timer.phase === "focus" ? timer.focusMinutes : timer.breakMinutes;
  const timerProgress = currentPhaseMinutes > 0 ? 1 - timer.remainingSeconds / (currentPhaseMinutes * 60) : 0;
  const todaySessions = stats.weekSessions.filter((session) => session.date === today);
  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.minutes, 0);
  const todayFocusCount = todaySessions.length;

  function updateWeight(subject: SubjectId, value: number) {
    setState((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [subject]: clampWeight(value),
      },
    }));
  }

  function updateDays(day: WeekDay) {
    setState((prev) => {
      const hasDay = prev.days.includes(day);
      const days = hasDay ? prev.days.filter((item) => item !== day) : [...prev.days, day];
      return {
        ...prev,
        days: days.length ? days : prev.days,
      };
    });
  }

  function addSession(formData: FormData) {
    const subject = formData.get("subject") as SubjectId;
    const minutes = Number(formData.get("minutes"));
    if (!subject || Number.isNaN(minutes) || minutes <= 0) {
      return;
    }

    setState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, { date: today, subject, minutes }],
    }));
  }

  function addSimulado(formData: FormData) {
    const date = String(formData.get("date") ?? "");
    const tipo = String(formData.get("tipo") ?? "");
    const area = String(formData.get("area") ?? "");
    const nota = Number(formData.get("nota"));
    if (!date || !tipo || !area || Number.isNaN(nota)) {
      return;
    }

    const next: SimuladoEntry = {
      id: Math.random().toString(36).slice(2, 10),
      date,
      tipo,
      area,
      nota,
    };

    setState((prev) => ({
      ...prev,
      simulados: [...prev.simulados, next],
    }));
  }

  function onTopicStatusChange(subject: SubjectId, topicId: string, topicName: string) {
    setState((prev) => {
      const current = prev.statusMap[topicId] ?? "novo";
      const next = nextTopicStatus(current);
      return updateTopicStatus(prev, topicId, topicName, subject, next);
    });
  }

  function startStudy(subject: SubjectId) {
    setTimer((prev) => ({
      ...prev,
      subject,
      phase: "focus",
      running: true,
      remainingSeconds: prev.focusMinutes * 60,
    }));
    setTab("hoje");
  }

  function startOrResumeTimer() {
    setTimer((prev) => ({
      ...prev,
      running: true,
      remainingSeconds: prev.remainingSeconds > 0 ? prev.remainingSeconds : prev.focusMinutes * 60,
    }));
  }

  function pauseTimer() {
    setTimer((prev) => ({
      ...prev,
      running: false,
    }));
  }

  function resetTimer() {
    setTimer((prev) => ({
      ...prev,
      phase: "focus",
      running: false,
      remainingSeconds: prev.focusMinutes * 60,
    }));
  }

  function skipPhase() {
    setTimer((prev) => ({
      ...prev,
      phase: prev.phase === "focus" ? "break" : "focus",
      running: false,
      remainingSeconds: (prev.phase === "focus" ? prev.breakMinutes : prev.focusMinutes) * 60,
    }));
  }

  function updateTimerDurations(nextFocusMinutes: number, nextBreakMinutes: number) {
    const focusMinutes = clampMinutes(nextFocusMinutes, 10, 90);
    const breakMinutes = clampMinutes(nextBreakMinutes, 3, 30);

    setTimer((prev) => {
      return {
        ...prev,
        focusMinutes,
        breakMinutes,
        remainingSeconds: !prev.running
          ? prev.phase === "focus"
            ? focusMinutes * 60
            : breakMinutes * 60
          : prev.remainingSeconds,
      };
    });
  }

  const suggestedSubjectMeta = SUBJECT_META[suggested.subject];

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Estudo simples</p>
          <h1>Study Plan</h1>
        </div>
        <div className="hero-meta">
          <span>{formatLongDate(today)}</span>
          <span>{formatStudyMinutes(todayMinutes)} hoje</span>
          <span>{state.sessions.length} sessoes no total</span>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Secoes do projeto">
        {TAB_ITEMS.map((item) => (
          <button key={item.key} className={item.key === tab ? "tab active" : "tab"} onClick={() => setTab(item.key)} type="button">
            {item.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === "hoje" && (
          <div className="today-layout">
            <section className="panel panel-hero">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Agora</p>
                  <h2>{suggestedSubjectMeta.name}</h2>
                </div>
                <span className="section-note">{formatDate(today)}</span>
              </div>

              <div className="today-hero">
                <div>
                  <p className="today-label">{suggested.reason}</p>
                  <h3>{suggested.topic}</h3>
                  <p className="hero-copy compact">
                    25 min foco / 5 min pausa.
                  </p>
                </div>

                <div className="today-actions">
                  <button className="primary" type="button" onClick={() => startStudy(suggested.subject)}>
                    Comecar foco
                  </button>
                  <button className="ghost" type="button" onClick={() => setTab("cronograma")}>
                    Planejar
                  </button>
                </div>
              </div>

              <div className="daily-summary" aria-label="Resumo discreto do dia">
                <span>
                  <strong>{todayFocusCount}</strong>
                  foco(s) hoje
                </span>
                <span>
                  <strong>{formatStudyMinutes(todayMinutes)}</strong>
                  estudados
                </span>
                <span>
                  <strong>{stats.streak}</strong>
                  dia(s) seguidos
                </span>
                <span>
                  <strong>{dueReviews.length}</strong>
                  revisoes
                </span>
              </div>
            </section>

            <section className="panel timer-panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Pomodoro</p>
                  <h2>Timer de foco</h2>
                </div>
                <span className="section-note">Sessao salva ao terminar o foco</span>
              </div>

              <div className="timer-card">
                <div className="timer-status">
                  <span className="badge soft">{timer.phase === "focus" ? "Foco" : "Pausa"}</span>
                  <span className="section-note">{SUBJECT_META[timer.subject].name}</span>
                </div>

                <div className="timer-face">{formatClock(timer.remainingSeconds)}</div>

                <div className="timer-track" aria-hidden="true">
                  <div className="timer-fill" style={{ width: `${Math.min(100, Math.max(0, timerProgress * 100))}%` }} />
                </div>

                <div className="timer-meta">
                  <span>{timer.running ? "Rodando agora" : "Pausado"}</span>
                  <span>{timer.completedCycles} ciclo(s) completos</span>
                </div>

                <div className="timer-controls">
                  <button className="primary" type="button" onClick={timer.running ? pauseTimer : startOrResumeTimer}>
                    {timer.running ? "Pausar" : "Iniciar"}
                  </button>
                  <button className="ghost" type="button" onClick={resetTimer}>
                    Reiniciar
                  </button>
                  <button className="ghost" type="button" onClick={skipPhase}>
                    Pular fase
                  </button>
                </div>

                <div className="timer-settings">
                  <label>
                    Foco
                    <input
                      type="number"
                      min="10"
                      max="90"
                      step="1"
                      value={timer.focusMinutes}
                      onChange={(event) => updateTimerDurations(Number(event.target.value), timer.breakMinutes)}
                    />
                  </label>
                  <label>
                    Pausa
                    <input
                      type="number"
                      min="3"
                      max="30"
                      step="1"
                      value={timer.breakMinutes}
                      onChange={(event) => updateTimerDurations(timer.focusMinutes, Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Materia
                    <select
                      value={timer.subject}
                      onChange={(event) => setTimer((prev) => ({ ...prev, subject: event.target.value as SubjectId }))}
                    >
                      {SUBJECT_ORDER.map((subject) => (
                        <option key={subject} value={subject}>
                          {SUBJECT_META[subject].name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="preset-row">
                  {[
                    { focus: 25, break: 5, label: "25 / 5" },
                    { focus: 40, break: 8, label: "40 / 8" },
                    { focus: 50, break: 10, label: "50 / 10" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="chip-button"
                      onClick={() => updateTimerDurations(preset.focus, preset.break)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === "cronograma" && (
          <div className="panel-grid">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Balanceamento</p>
                  <h2>Peso por materia</h2>
                </div>
                <span className={totalWeight === 100 ? "badge success" : "badge warning"}>Soma atual: {totalWeight}%</span>
              </div>

              <div className="stack">
                {SUBJECT_ORDER.map((subject) => (
                  <label className="weight-row" key={subject}>
                    <span className="weight-name">{SUBJECT_META[subject].name}</span>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={state.weights[subject]}
                      onChange={(event) => updateWeight(subject, Number(event.target.value))}
                    />
                    <strong>{state.weights[subject]}%</strong>
                  </label>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Disponibilidade</p>
                  <h2>Horas e dias uteis</h2>
                </div>
              </div>

              <div className="availability-grid">
                <label>
                  Horas por dia
                  <input
                    type="number"
                    min="1"
                    max="14"
                    step="0.5"
                    value={state.hoursPerDay}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        hoursPerDay: Number(event.target.value) || 4,
                      }))
                    }
                  />
                </label>

                <div className="day-grid">
                  {Object.entries(WEEKDAY_LABELS).map(([day, label]) => {
                    const checked = state.days.includes(day as WeekDay);
                    return (
                      <label key={day} className="day-pill">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => updateDays(day as WeekDay)}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="panel panel-wide">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Cronograma</p>
                  <h2>Blocos sugeridos</h2>
                </div>
                <span className="section-note">{formatStudyTime(state.hoursPerDay * state.days.length)} por semana</span>
              </div>

              <div className="schedule-grid">
                {state.days.map((day) => {
                  const blocks = schedule[day] ?? [];
                  const total = blocks.reduce((sum, block) => sum + block.hours, 0);

                  return (
                    <article className="schedule-card" key={day}>
                      <header>
                        <strong>{WEEKDAY_LABELS[day]}</strong>
                        <span>{formatStudyTime(total)}</span>
                      </header>
                      <div className="chips">
                        {blocks.length ? (
                          blocks.map((block, index) => (
                            <span
                              className="chip"
                              key={`${day}-${index}-${block.subject}`}
                              style={{
                                color: SUBJECT_META[block.subject].color,
                                borderColor: `${SUBJECT_META[block.subject].color}55`,
                                background: `${SUBJECT_META[block.subject].color}14`,
                              }}
                            >
                              {SUBJECT_META[block.subject].name} - {formatStudyTime(block.hours)}
                            </span>
                          ))
                        ) : (
                          <span className="muted">Sem blocos sugeridos</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {tab === "trilha" && (
          <section className="panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">Conteudo</p>
                <h2>Trilha por materia</h2>
              </div>
              <span className="section-note">Clique em um topico para atualizar o status</span>
            </div>

            <div className="subject-list">
              {SUBJECT_ORDER.map((subject) => {
                const pct = progressBySubject(state, subject);
                const revisionPct = subjectReviewProgress(state, subject);
                return (
                  <details className="subject-block" key={subject}>
                    <summary>
                      <div>
                        <strong>{SUBJECT_META[subject].name}</strong>
                        <span>{TOPICS[subject].length} topicos - {pct}% dominado</span>
                      </div>
                      <div className="summary-meta">
                        <span className="mini-pill">{revisionPct}% em andamento</span>
                      </div>
                    </summary>
                    <div className="topic-list">
                      {TOPICS[subject].map((topic) => {
                        const status = state.statusMap[topic.id] ?? "novo";
                        return (
                          <button
                            type="button"
                            className="topic-row"
                            key={topic.id}
                            onClick={() => onTopicStatusChange(subject, topic.id, topic.name)}
                          >
                            <span>{topic.name}</span>
                            <span className={`status status-${status}`}>{topicStatusLabel(status)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        )}

        {tab === "revisao" && (
          <div className="panel-grid">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Hoje</p>
                  <h2>Revisoes pendentes</h2>
                </div>
                <span className="badge warning">{dueReviews.length} itens</span>
              </div>

              <div className="stack">
                {dueReviews.length ? (
                  dueReviews.map((review) => (
                    <article className="review-item" key={review.id}>
                      <div>
                        <strong>{review.topicName}</strong>
                        <p>
                          {SUBJECT_META[review.subject].name} - etapa {review.stage + 1}/{REVIEW_OFFSETS.length}
                        </p>
                        <span>Venceu em {formatDate(review.dueDate)}</span>
                      </div>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => setState((prev) => markReviewDone(prev, review.id))}
                      >
                        Revisado
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty">Nenhuma revisao pendente hoje.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Proximos passos</p>
                  <h2>Fila futura</h2>
                </div>
              </div>

              <div className="stack">
                {upcomingReviews.length ? (
                  upcomingReviews.map((review) => (
                    <article className="review-item" key={review.id}>
                      <div>
                        <strong>{review.topicName}</strong>
                        <p>
                          {SUBJECT_META[review.subject].name} - etapa {review.stage + 1}/{REVIEW_OFFSETS.length}
                        </p>
                      </div>
                      <span>{formatDate(review.dueDate)}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty">Domine topicos na trilha para alimentar a fila.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "simulados" && (
          <div className="panel-grid">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Registro</p>
                  <h2>Adicionar simulado</h2>
                </div>
              </div>

              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  addSimulado(new FormData(event.currentTarget));
                  event.currentTarget.reset();
                }}
              >
                <label>
                  Data
                  <input type="date" name="date" defaultValue={today} />
                </label>
                <label>
                  Tipo
                  <select name="tipo" defaultValue="Enem">
                    <option>Enem</option>
                    <option>Inatel</option>
                    <option>Simulado geral</option>
                  </select>
                </label>
                <label>
                  Area
                  <select name="area" defaultValue="Geral">
                    <option>Matematica</option>
                    <option>Fisica</option>
                    <option>Quimica</option>
                    <option>Linguagens</option>
                    <option>Humanas</option>
                    <option>Redacao</option>
                    <option>Geral</option>
                  </select>
                </label>
                <label>
                  Nota
                  <input type="number" name="nota" step="0.1" />
                </label>
                <button className="primary" type="submit">
                  Salvar
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Historico</p>
                  <h2>Ultimos resultados</h2>
                </div>
              </div>

              <div className="stack">
                {simulados.length ? (
                  simulados.map((item) => (
                    <article className="simulado-row" key={item.id}>
                      <div>
                        <strong>{formatDate(item.date)}</strong>
                        <p>
                          {item.tipo} - {item.area}
                        </p>
                      </div>
                      <div className="simulado-actions">
                        <span className="score">{item.nota}</span>
                        <button
                          type="button"
                          className="ghost danger"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              simulados: prev.simulados.filter((simulado) => simulado.id !== item.id),
                            }))
                          }
                        >
                          excluir
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty">Nenhum simulado registrado ainda.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "ajustes" && (
          <div className="panel-grid">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Notas do projeto</p>
                  <h2>Sobre esta versao</h2>
                </div>
              </div>
              <div className="copy-block">
                <p>
                  Esta versao prioriza clareza: abrir o app, ver o estudo do dia, iniciar o pomodoro e registrar o
                  foco sem ruido visual.
                </p>
                <p>
                  O cronograma, as revisoes e os simulados continuam disponiveis, mas a ideia principal agora e reduzir
                  friccao para comecar a estudar.
                </p>
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Reset</p>
                  <h2>Dados locais</h2>
                </div>
              </div>
              <p className="section-note">Tudo fica salvo no navegador. Voce pode recomecar quando quiser.</p>
              <button
                type="button"
                className="ghost danger"
                onClick={() => {
                  if (window.confirm("Isso vai apagar todo o progresso salvo. Quer continuar?")) {
                    setState(createFreshState(todayKey()));
                    setTab("hoje");
                    setTimer({
                      subject: suggested.subject,
                      phase: "focus",
                      focusMinutes: 25,
                      breakMinutes: 5,
                      remainingSeconds: 25 * 60,
                      running: false,
                      completedCycles: 0,
                    });
                  }
                }}
              >
                Apagar todos os dados
              </button>
            </section>

            <section className="panel panel-wide">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Registro rapido</p>
                  <h2>Adicionar uma sessao manual</h2>
                </div>
              </div>
              <form
                className="stack manual-session"
                onSubmit={(event) => {
                  event.preventDefault();
                  addSession(new FormData(event.currentTarget));
                  event.currentTarget.reset();
                }}
              >
                <label>
                  Materia
                  <select name="subject" defaultValue="matematica">
                    {SUBJECT_ORDER.map((subject) => (
                      <option key={subject} value={subject}>
                        {SUBJECT_META[subject].name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Minutos
                  <input name="minutes" type="number" min="5" step="5" defaultValue={60} />
                </label>
                <button className="primary" type="submit">
                  Registrar
                </button>
              </form>
            </section>
          </div>
        )}
      </main>

      <section className="countdown-grid" aria-label="Datas importantes">
        <article className="count-card">
          <p>ENEM, 1 dia</p>
          <strong>
            {Math.max(
              0,
              Math.round((new Date(`${TARGET_DATES.enemDay1}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000),
            )}
          </strong>
          <span>
            {formatDate(TARGET_DATES.enemDay1)} - Linguagens, Humanas e Redacao
          </span>
        </article>
        <article className="count-card">
          <p>ENEM, 2 dia</p>
          <strong>
            {Math.max(
              0,
              Math.round((new Date(`${TARGET_DATES.enemDay2}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000),
            )}
          </strong>
          <span>
            {formatDate(TARGET_DATES.enemDay2)} - Natureza e Matematica
          </span>
        </article>
        <article className="count-card">
          <p>Inatel estimado</p>
          <strong>
            {Math.max(
              0,
              Math.round((new Date(`${TARGET_DATES.inatelEstimate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000),
            )}
          </strong>
          <span>
            {formatDate(TARGET_DATES.inatelEstimate)} - ajuste quando o edital sair
          </span>
        </article>
      </section>
    </div>
  );
}

export default App;
