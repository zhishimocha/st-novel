'use client';

import Link from 'next/link';
import { useLibrary } from './library-context';

export function HighlightsView() {
  const { highlights, getBookById } = useLibrary();

  return (
    <section className="stackGap">
      <div className="card">
        <h1>摘录本</h1>
        <p className="muted">这里集中放你的高光和批注。</p>
      </div>
      {highlights.length === 0 ? (
        <div className="card emptyState">
          <p className="muted">你还没有划过任何句子。</p>
        </div>
      ) : highlights.map((item) => {
        const book = getBookById(item.bookId);
        return (
          <Link key={item.id} href={`/book/${item.bookId}#${item.messageId}`} className="card stackGap">
            <div className="rowBetween wrapGap">
              <strong>{item.text}</strong>
              <span className={`badge ${item.color}`}>{item.color}</span>
            </div>
            {item.note ? <p>{item.note}</p> : null}
            <p className="muted">{book?.title ?? '未知书籍'}</p>
          </Link>
        );
      })}
    </section>
  );
}
