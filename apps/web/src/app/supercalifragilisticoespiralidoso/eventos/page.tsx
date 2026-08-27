"use client";

import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventInput } from "@fullcalendar/core";
import { Header, Card, Button } from "@/components/common";
import { useTranslation } from "@/lib/useTranslation";

type DisciplineId = "football" | "basketball" | "tennis" | "swimming";

interface MockEvent {
  label: string;
  color: string;
  discipline: DisciplineId;
}

interface EventItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  icon: string;
}

// Mock event data: ISO date -> array of events
const mockEventsByDate: Record<string, MockEvent[]> = {
  "2024-10-05": [
    { label: "Natación", color: "bg-blue-100 text-blue-700", discipline: "swimming" },
  ],
  "2024-10-08": [
    { label: "Liga Final", color: "bg-purple-100 text-purple-700", discipline: "football" },
  ],
  "2024-10-12": [
    { label: "Fútbol", color: "bg-green-100 text-green-700", discipline: "football" },
    { label: "Baloncesto", color: "bg-orange-100 text-orange-700", discipline: "basketball" },
  ],
  "2024-10-15": [
    { label: "Partido Tenis", color: "bg-yellow-100 text-yellow-700", discipline: "tennis" },
  ],
  "2024-10-20": [
    { label: "Natación", color: "bg-blue-100 text-blue-700", discipline: "swimming" },
  ],
  "2024-10-25": [
    { label: "Campeonato", color: "bg-red-100 text-red-700", discipline: "basketball" },
  ],
};

export default function EventsPage() {
  const { t } = useTranslation();
  const calendarRef = useRef<FullCalendar>(null);
  const [monthLabel, setMonthLabel] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState("2024-10-15");
  const [visibleDisciplines, setVisibleDisciplines] = useState<
    Record<DisciplineId, boolean>
  >({
    football: true,
    basketball: true,
    tennis: true,
    swimming: true,
  });

  // Today's events (mock)
  const todayEvents: EventItem[] = [
    {
      id: "1",
      title: "Entrenamiento Fútbol",
      startTime: "14:00",
      endTime: "16:00",
      icon: "⚽",
    },
    {
      id: "2",
      title: "Práctica Baloncesto",
      startTime: "16:30",
      endTime: "18:00",
      icon: "🏀",
    },
  ];

  const calendarEvents: EventInput[] = useMemo(
    () =>
      Object.entries(mockEventsByDate).flatMap(([date, events]) =>
        events
          .filter((event) => visibleDisciplines[event.discipline])
          .map((event, idx) => ({
            id: `${date}-${idx}`,
            title: event.label,
            start: date,
            allDay: true,
            extendedProps: { color: event.color },
          })),
      ),
    [visibleDisciplines],
  );

  const handlePrevMonth = () => calendarRef.current?.getApi().prev();
  const handleNextMonth = () => calendarRef.current?.getApi().next();

  const handleViewModeChange = (mode: "month" | "week") => {
    setViewMode(mode);
    calendarRef.current
      ?.getApi()
      .changeView(mode === "month" ? "dayGridMonth" : "dayGridWeek");
  };

  const renderEventContent = (arg: EventContentArg) => {
    const color = (arg.event.extendedProps.color as string) || "bg-slate-100 text-slate-700";
    return (
      <div
        title={arg.event.title}
        className={`text-xs px-1.5 py-0.5 rounded font-medium truncate ${color}`}
      >
        <span className="mr-0.5">●</span>
        {arg.event.title}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title={t("events.title")} subtitle={t("events.subtitle")}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t("events.searchPlaceholder")}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </Header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Card */}
          <Card className="lg:col-span-2 fullcalendar-card">
            {/* Month Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-100 rounded transition"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-slate-900 min-w-[180px] capitalize">
                  {monthLabel}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-100 rounded transition"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Toggle */}
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => handleViewModeChange("month")}
                  className={`px-4 py-1 rounded transition font-medium text-sm ${
                    viewMode === "month"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  {t("events.month")}
                </button>
                <button
                  onClick={() => handleViewModeChange("week")}
                  className={`px-4 py-1 rounded transition font-medium text-sm ${
                    viewMode === "week"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  {t("events.week")}
                </button>
              </div>
            </div>

            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate="2024-10-15"
              headerToolbar={false}
              height="auto"
              firstDay={1}
              events={calendarEvents}
              eventContent={renderEventContent}
              dayMaxEvents={2}
              selectable
              dateClick={(info) => setSelectedDate(info.dateStr)}
              dayCellClassNames={(arg) =>
                arg.dateStr === selectedDate ? ["fc-day-selected"] : []
              }
              dayHeaderContent={(arg) => {
                const labels = [
                  t("calendar.sun"),
                  t("calendar.mon"),
                  t("calendar.tue"),
                  t("calendar.wed"),
                  t("calendar.thu"),
                  t("calendar.fri"),
                  t("calendar.sat"),
                ];
                return labels[arg.date.getDay()];
              }}
              datesSet={(arg) => {
                setMonthLabel(
                  arg.view.currentStart.toLocaleString("es-ES", {
                    month: "long",
                    year: "numeric",
                  }),
                );
              }}
            />
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Active Events Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">
                    {t("events.activeEvents")}
                  </p>
                  <p className="text-4xl font-bold mt-2">12</p>
                  <p className="text-xs mt-3 opacity-75">
                    {t("events.requiresAttention")}
                  </p>
                </div>
              </div>
            </Card>

            {/* Events Today Card */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("events.eventsToday")}
              </h3>
              <div className="space-y-4">
                {todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="text-2xl flex-shrink-0">{event.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">
                        {event.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Disciplines Card */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">
                {t("events.disciplines")}
              </h3>
              <div className="space-y-3">
                {(
                  [
                    { id: "football", label: t("events.football") },
                    { id: "basketball", label: t("events.basketball") },
                    { id: "tennis", label: t("events.tennis") },
                    { id: "swimming", label: t("events.swimming") },
                  ] as Array<{ id: DisciplineId; label: string }>
                ).map((discipline) => (
                  <label
                    key={discipline.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={visibleDisciplines[discipline.id]}
                      onChange={() =>
                        setVisibleDisciplines((prev) => ({
                          ...prev,
                          [discipline.id]: !prev[discipline.id],
                        }))
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">
                      {discipline.label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center group">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      <style jsx global>{`
        .fullcalendar-card .fc {
          font-family: inherit;
        }
        .fullcalendar-card .fc-theme-standard td,
        .fullcalendar-card .fc-theme-standard th {
          border-color: #e2e8f0;
        }
        .fullcalendar-card .fc-col-header-cell-cushion {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          padding: 0.5rem 0;
          text-decoration: none;
        }
        .fullcalendar-card .fc-daygrid-day-number {
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          padding: 0.35rem;
          text-decoration: none;
        }
        .fullcalendar-card .fc-day-other .fc-daygrid-day-number {
          color: #94a3b8;
        }
        .fullcalendar-card .fc-day-selected {
          background-color: #eff6ff;
        }
        .fullcalendar-card .fc-day-selected .fc-daygrid-day-frame {
          box-shadow: inset 0 0 0 2px #3b82f6;
          border-radius: 0.5rem;
        }
        .fullcalendar-card .fc-day-selected .fc-daygrid-day-number {
          background-color: #2563eb;
          color: white;
          border-radius: 9999px;
          width: 1.25rem;
          height: 1.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .fullcalendar-card .fc-daygrid-event {
          margin: 1px 2px;
          border: none;
          background: transparent;
        }
        .fullcalendar-card .fc-daygrid-more-link {
          font-size: 0.7rem;
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}
