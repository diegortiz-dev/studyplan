import { useMemo, useState } from "react";
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
  listTopics,
  markReviewDone,
  nextTopicStatus,
  progressBySubject,
  summaryStats,
  todayKey,
  updateTopicStatus,
  subjectReviewProgress,
} from "./study";
import { usePersistentState } from "./storage";
import type { SimuladoEntry, StudyState, SubjectId, WeekDay } from "./types";

const APP_STORAGE_KEY = "studyplan-state-v1";
const TAB_KEYS = ["painel", "cronograma", "trilha", "revisao", "simulados", "ajustes"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function clampWeight(value: number) {
  return Math.max(0, Math.min(60, value));
}

function topicStatusLabel(status: string) {
  switch (status) {
    case "estudando":
      return "Estudando";
    case "revisar":
      return "Revisar";
    case "dominado":
      return "Dominado";
    default:
      return "Não iniciado";
  }
}

function App() {
  const [state, setState] = usePersistentState<StudyState>(APP_STORAGE_KEY, createFreshState(todayKey()));
  const [tab, setTab] = useState<TabKey>("painel");
  const today = todayKey();
  const stats = useMemo(() => summaryStats(state, today), [state, today]);
  const schedule = useMemo(() => computeSchedule(state), [state]);
  const topicCount = listTopics().length;

  const totalWeight = SUBJECT_ORDER.reduce((sum, subject) => sum + state.weights[subject], 0);

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

  const dueReviews = state.reviews.filter((review) => review.dueDate <= today).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  const upcomingReviews = state.reviews
    .filter((review) => review.dueDate > today)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    .slice(0, 10);

  const simulados = [...state.simulados].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="app-shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <header className="hero">
        <div>
          <p className="eyebrow">Painel de missão</p>
          <h1>Study Plan</h1>
          <p className="hero-copy">
            Uma base local-first para organizar a rotina de estudos, revisar o que importa e enxergar evolução sem
            ruído.
          </p>
        </div>
        <div className="hero-meta">
          <span>{formatLongDate(today)}</span>
          <span>{topicCount} tópicos mapeados</span>
          <span>{state.sessions.length} sessões registradas</span>
        </div>
      </header>

      <section className="countdown-grid">
        <article className="count-card">
          <p>ENEM, 1º dia</p>
          <strong>{Math.max(0, Math.round((new Date(`${TARGET_DATES.enemDay1}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000))}</strong>
          <span>{formatDate(TARGET_DATES.enemDay1)} · Linguagens, Humanas e Redação</span>
        </article>
        <article className="count-card">
          <p>ENEM, 2º dia</p>
          <strong>{Math.max(0, Math.round((new Date(`${TARGET_DATES.enemDay2}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000))}</strong>
          <span>{formatDate(TARGET_DATES.enemDay2)} · Natureza e Matemática</span>
        </article>
        <article className="count-card">
          <p>Inatel estimado</p>
          <strong>{Math.max(0, Math.round((new Date(`${TARGET_DATES.inatelEstimate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000))}</strong>
          <span>{formatDate(TARGET_DATES.inatelEstimate)} · ajuste quando o edital sair</span>
        </article>
      </section>

      <nav className="tab-bar" aria-label="Seções do projeto">
        {TAB_KEYS.map((item) => (
          <button key={item} className={item === tab ? "tab active" : "tab"} onClick={() => setTab(item)} type="button">
            {item}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === "painel" && (
          <div className="panel-grid">
            <section className="panel hero-panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Resumo</p>
                  <h2>Progresso da semana</h2>
                </div>
                <span className="section-note">
                  {formatDate(stats.weekStart)} - {formatDate(stats.weekEnd)}
                </span>
              </div>

              <div className="stats-grid">
                <article className="metric">
                  <strong>{(stats.totalWeekMinutes / 60).toFixed(1)}h</strong>
                  <span>estudadas nesta semana</span>
                </article>
                <article className="metric">
                  <strong>{(stats.totalMinutes / 60).toFixed(1)}h</strong>
                  <span>acumuladas no projeto</span>
                </article>
                <article className="metric">
                  <strong>{stats.streak}</strong>
                  <span>dias seguidos estudando</span>
                </article>
                <article className="metric">
                  <strong className={stats.pendingReviews ? "warning" : ""}>{stats.pendingReviews}</strong>
                  <span>revisões pendentes hoje</span>
                </article>
              </div>

              <div className="subject-bars">
                {SUBJECT_ORDER.map((subject) => {
                  const target = Math.round(stats.targetWeekMinutes * (state.weights[subject] / 100));
                  const done = stats.bySubject[subject] ?? 0;
                  const progress = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
                  return (
                    <div className="bar-row" key={subject}>
                      <span>{SUBJECT_META[subject].name}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${progress}%`, background: SUBJECT_META[subject].color }} />
                      </div>
                      <span>{(done / 60).toFixed(1)}h / {(target / 60).toFixed(1)}h</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Ação rápida</p>
                  <h2>Registrar sessão</h2>
                </div>
              </div>
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  addSession(new FormData(event.currentTarget));
                  event.currentTarget.reset();
                }}
              >
                <label>
                  Matéria
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

        {tab === "cronograma" && (
          <div className="panel-grid">
            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Balanceamento</p>
                  <h2>Peso por matéria</h2>
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
                  <h2>Horas e dias úteis</h2>
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
                <span className="section-note">{(state.hoursPerDay * state.days.length).toFixed(1)}h por semana</span>
              </div>

              <div className="schedule-grid">
                {state.days.map((day) => {
                  const blocks = schedule[day] ?? [];
                  const total = blocks.reduce((sum, block) => sum + block.hours, 0);

                  return (
                    <article className="schedule-card" key={day}>
                      <header>
                        <strong>{WEEKDAY_LABELS[day]}</strong>
                        <span>{total.toFixed(1)}h</span>
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
                              {SUBJECT_META[block.subject].name} · {block.hours}h
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
                <p className="section-kicker">Conteúdo</p>
                <h2>Trilha por matéria</h2>
              </div>
              <span className="section-note">Clique na matéria para expandir</span>
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
                        <span>{TOPICS[subject].length} tópicos · {pct}% dominado</span>
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
                  <h2>Revisões pendentes</h2>
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
                          {SUBJECT_META[review.subject].name} · etapa {review.stage + 1}/{REVIEW_OFFSETS.length}
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
                  <div className="empty">Nenhuma revisão pendente hoje.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Próximos passos</p>
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
                          {SUBJECT_META[review.subject].name} · etapa {review.stage + 1}/{REVIEW_OFFSETS.length}
                        </p>
                      </div>
                      <span>{formatDate(review.dueDate)}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty">Domine tópicos na trilha para alimentar a fila.</div>
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
                  Área
                  <select name="area" defaultValue="Geral">
                    <option>Matemática</option>
                    <option>Física</option>
                    <option>Química</option>
                    <option>Linguagens</option>
                    <option>Humanas</option>
                    <option>Redação</option>
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
                  <p className="section-kicker">Histórico</p>
                  <h2>Últimos resultados</h2>
                </div>
              </div>

              <div className="stack">
                {simulados.length ? (
                  simulados.map((item) => (
                    <article className="simulado-row" key={item.id}>
                      <div>
                        <strong>{formatDate(item.date)}</strong>
                        <p>
                          {item.tipo} · {item.area}
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
                  <h2>Sobre esta versão</h2>
                </div>
              </div>
              <div className="copy-block">
                <p>
                  A base foi remodelada para ficar local-first, tipada e fácil de expandir. O foco agora é clareza:
                  acompanhar rotina, priorizar matérias, marcar evolução e deixar o projeto pronto para crescer.
                </p>
                <p>
                  Próximos passos naturais: adicionar exportação de dados, calendário visual, metas semanais mais
                  inteligentes e sincronização opcional.
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
              <p className="section-note">Tudo fica salvo no navegador. Você pode recomeçar quando quiser.</p>
              <button
                type="button"
                className="ghost danger"
                onClick={() => {
                  if (window.confirm("Isso vai apagar todo o progresso salvo. Quer continuar?")) {
                    setState(createFreshState(todayKey()));
                    setTab("painel");
                  }
                }}
              >
                Apagar todos os dados
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
