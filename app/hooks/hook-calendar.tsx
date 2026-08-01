"use client";

import { useMemo, useState } from "react";

type CalendarIssue = {
  date: string;
};

type HookCalendarProps = {
  issues: CalendarIssue[];
  basePath: string;
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export default function HookCalendar({ issues, basePath }: HookCalendarProps) {
  const months = useMemo(
    () => [...new Set(issues.map((issue) => issue.date.slice(0, 7)))].sort(),
    [issues],
  );
  const [monthIndex, setMonthIndex] = useState(Math.max(0, months.length - 1));
  const activeMonth = months[monthIndex] ?? issues[0]?.date.slice(0, 7) ?? "2026-08";
  const [yearText, monthText] = activeMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const issueByDay = new Map(
    issues
      .filter((issue) => issue.date.startsWith(activeMonth))
      .map((issue) => [Number(issue.date.slice(-2)), issue]),
  );
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );

  return (
    <aside className="hook-calendar-card" aria-label={`${year} 年 ${month} 月训练日历`}>
      <div className="hook-calendar-heading">
        <span>训练日历</span>
        <button
          type="button"
          onClick={() => setMonthIndex((current) => Math.max(0, current - 1))}
          disabled={monthIndex === 0}
          aria-label="上一个有训练的月份"
        >
          ‹
        </button>
        <strong aria-live="polite">{year} 年 {month} 月</strong>
        <button
          type="button"
          onClick={() => setMonthIndex((current) => Math.min(months.length - 1, current + 1))}
          disabled={monthIndex === months.length - 1}
          aria-label="下一个有训练的月份"
        >
          ›
        </button>
      </div>
      <div className="hook-weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="hook-calendar-grid">
        {calendarCells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} />;
          const issue = issueByDay.get(day);
          return issue ? (
            <a
              href={`${basePath}/hooks/${issue.date.replaceAll("-", "")}/`}
              key={day}
              aria-label={`进入 ${formatDate(issue.date)}钩子训练`}
            >
              {day}<i aria-hidden="true" />
            </a>
          ) : <span className="empty-day" key={day}>{day}</span>;
        })}
      </div>
      <p>从 2026 年 7 月 22 日开始归档</p>
    </aside>
  );
}
