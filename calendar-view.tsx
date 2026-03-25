'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLibrary } from './library-context';
import { formatDate } from '@/lib/utils';

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function CalendarView() {
  const { getMonthlyImportCount, getBooksOnDate, hasBooksOnDate } = useLibrary();
  const today = new Date();
  const [view, setView] = useState<'month' | 'year'>('month');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(formatDate(today.toISOString()));

  const totalDays = daysInMonth(year, month);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells = useMemo(() => {
    const list: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) list.push(null);
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      list.push({ date, day });
    }
    return list;
  }, [year, month, firstWeekday, totalDays]);

  const books = getBooksOnDate(selectedDate);

  function moveMonth(offset: number) {
    const next = new Date(year, month - 1 + offset, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
    setSelectedDate(formatDate(next.toISOString()));
  }

  if (view === 'year') {
    return (
      <section className="stackGap">
        <div className="card rowBetween">
          <button className="ghostButton" onClick={() => setYear((v) => v - 1)}>上一年</button>
          <h2>{year}年</h2>
          <button className="ghostButton" onClick={() => setYear((v) => v + 1)}>下一年</button>
        </div>
        <div className="monthOverviewGrid">
          {Array.from({ length: 12 }).map((_, idx) => {
            const count = getMonthlyImportCount(year, idx + 1);
            return (
              <button
                key={idx}
                className="monthOverviewCard"
                onClick={() => {
                  setMonth(idx + 1);
                  setView('month');
                }}
              >
                <strong>{idx + 1}月</strong>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="stackGap">
      <div className="card rowBetween wrapGap">
        <button className="ghostButton" onClick={() => moveMonth(-1)}>上月</button>
        <button className="dateButton" onClick={() => setView('year')}>
          {year}年{month}月
        </button>
        <button className="ghostButton" onClick={() => moveMonth(1)}>下月</button>
      </div>

      <div className="card">
        <div className="calendarHeader">
          {['日', '一', '二', '三', '四', '五', '六'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="calendarGrid">
          {cells.map((cell, index) => {
            if (!cell) return <div key={`blank-${index}`} className="calendarCell blankCell" />;
            const active = selectedDate === cell.date;
            const hasRecord = hasBooksOnDate(cell.date);
            return (
              <button
                key={cell.date}
                className={`calendarCell ${active ? 'calendarCellActive' : ''}`}
                onClick={() => setSelectedDate(cell.date)}
                type="button"
              >
                <span>{cell.day}</span>
                {hasRecord ? <i className="recordDot" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card stackGap">
        <div>
          <h3>{selectedDate} 的记录</h3>
          <p className="muted">这个列表按导入的聊天记录，也就是你说的小说来算。</p>
        </div>
        {books.length === 0 ? (
          <p className="muted">这一天还没有导入的小说。</p>
        ) : (
          books.map((book) => (
            <Link key={book.id} href={`/book/${book.id}`} className="dayEntry">
              <div className="miniCover">
                {book.cover ? <img src={book.cover} alt={book.title} className="coverImage" /> : <div className="coverFallback">{book.characterName.slice(0, 2)}</div>}
              </div>
              <div className="bookMeta">
                <strong>{book.title}</strong>
                <span className="muted">角色：{book.characterName}</span>
                <span className="muted">作者：{book.author}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
