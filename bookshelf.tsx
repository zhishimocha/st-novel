'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLibrary } from './library-context';
import { formatDateCN } from '@/lib/utils';

export function Bookshelf() {
  const { books } = useLibrary();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((book) =>
      [book.title, book.characterName, book.author].some((field) => field.toLowerCase().includes(q)),
    );
  }, [books, query]);

  if (books.length === 0) {
    return (
      <section className="card emptyState">
        <h2>书架还是空的</h2>
        <p className="muted">先导入一份 jsonl，第一本书就会出现在这里。</p>
      </section>
    );
  }

  return (
    <section className="stackGap">
      <div className="card">
        <input
          className="searchInput"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜书名 / 角色名 / 作者"
        />
      </div>
      <div className="bookGrid">
        {list.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`} className="bookCard">
            <div className="coverShell">
              {book.cover ? <img src={book.cover} alt={book.title} className="coverImage" /> : <div className="coverFallback">{book.characterName.slice(0, 2)}</div>}
            </div>
            <div className="bookMeta">
              <strong>{book.title}</strong>
              <span className="muted">作者：{book.author}</span>
              <span className="muted">角色：{book.characterName}</span>
              <span className="muted">导入：{formatDateCN(book.importedAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
