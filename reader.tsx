'use client';

import { useMemo, useState } from 'react';
import { useLibrary } from './library-context';
import { Highlight, MessageItem } from '@/lib/types';
import { formatDateCN } from '@/lib/utils';

const palette = [
  { key: 'yellow', label: '黄色' },
  { key: 'pink', label: '粉色' },
  { key: 'blue', label: '蓝色' },
  { key: 'green', label: '绿色' },
] as const;

function splitText(message: MessageItem, items: Highlight[]) {
  if (items.length === 0) return [{ text: message.content, highlight: null as Highlight | null }];
  const sorted = [...items].sort((a, b) => a.startOffset - b.startOffset);
  const parts: Array<{ text: string; highlight: Highlight | null }> = [];
  let cursor = 0;

  sorted.forEach((item) => {
    if (item.startOffset > cursor) {
      parts.push({ text: message.content.slice(cursor, item.startOffset), highlight: null });
    }
    parts.push({ text: message.content.slice(item.startOffset, item.endOffset), highlight: item });
    cursor = item.endOffset;
  });

  if (cursor < message.content.length) {
    parts.push({ text: message.content.slice(cursor), highlight: null });
  }

  return parts;
}

export function Reader({ bookId }: { bookId: string }) {
  const { getBookById, getChaptersByBookId, getHighlightsByBookId, addHighlight, removeHighlight, searchBook } = useLibrary();
  const book = getBookById(bookId);
  const chapters = getChaptersByBookId(bookId);
  const highlights = getHighlightsByBookId(bookId);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<null | { messageId: string; chapterId: string; start: number; end: number; text: string }>(null);
  const [note, setNote] = useState('');
  const [color, setColor] = useState<Highlight['color']>('yellow');

  const searchResults = useMemo(() => searchBook(bookId, query), [bookId, query, searchBook]);

  if (!book) {
    return <section className="card"><p>没找到这本书。</p></section>;
  }

  function saveHighlight() {
    if (!selection) return;
    addHighlight({
      bookId,
      chapterId: selection.chapterId,
      messageId: selection.messageId,
      startOffset: selection.start,
      endOffset: selection.end,
      text: selection.text,
      color,
      note: note.trim() || undefined,
    });
    setSelection(null);
    setNote('');
  }

  return (
    <section className="stackGap">
      <div className="card stackGap">
        <div className="rowBetween wrapGap">
          <div>
            <h1>{book.title}</h1>
            <p className="muted">{book.characterName} · {book.author} · 导入于 {formatDateCN(book.importedAt)}</p>
          </div>
        </div>
        <input
          className="searchInput"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索这本书里的句子"
        />
        {query.trim() ? (
          <div className="searchResultBox">
            {searchResults.length === 0 ? <p className="muted">没有搜到。</p> : searchResults.map((item) => (
              <a key={`${item.chapterId}-${item.messageId}-${item.index}`} className="searchResultItem" href={`#${item.messageId}`}>
                {item.preview}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      {selection ? (
        <div className="card stackGap">
          <h3>新高光</h3>
          <p className="muted">已选中：{selection.text}</p>
          <div className="chipRow">
            {palette.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`chip ${color === item.key ? 'chipActive' : ''}`}
                onClick={() => setColor(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <textarea
            className="textArea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="给这段写一句批注"
          />
          <div className="rowGap">
            <button className="primaryButton" type="button" onClick={saveHighlight}>保存高光</button>
            <button className="ghostButton" type="button" onClick={() => setSelection(null)}>取消</button>
          </div>
        </div>
      ) : null}

      {chapters.map((chapter) => (
        <article key={chapter.id} className="card stackGap">
          <header>
            <h2>{chapter.title}</h2>
            <p className="muted">像小说一样看，不保留对话气泡。</p>
          </header>
          <div className="novelFlow">
            {chapter.messages.map((message) => {
              const related = highlights.filter((item) => item.messageId === message.id);
              const parts = splitText(message, related);
              return (
                <div key={message.id} id={message.id} className="novelParagraph">
                  <div className="speakerLine">{message.speaker}</div>
                  <p
                    onMouseUp={() => {
                      const selectionObj = window.getSelection();
                      const text = selectionObj?.toString().trim();
                      if (!text) return;
                      const base = selectionObj?.anchorNode?.parentElement;
                      if (!base) return;
                      const parent = base.closest('[data-message-content="true"]') as HTMLElement | null;
                      if (!parent) return;
                      const fullText = parent.dataset.fulltext ?? '';
                      const index = fullText.indexOf(text);
                      if (index < 0) return;
                      setSelection({
                        chapterId: chapter.id,
                        messageId: message.id,
                        start: index,
                        end: index + text.length,
                        text,
                      });
                    }}
                    data-message-content="true"
                    data-fulltext={message.content}
                  >
                    {parts.map((part, idx) => {
                      if (!part.highlight) return <span key={`${message.id}-${idx}`}>{part.text}</span>;
                      return (
                        <mark key={part.highlight.id} className={`highlightMark ${part.highlight.color}`}>
                          {part.text}
                          <button
                            type="button"
                            className="deleteMarkButton"
                            onClick={() => removeHighlight(part.highlight!.id)}
                            title="删除高光"
                          >
                            ×
                          </button>
                        </mark>
                      );
                    })}
                  </p>
                  {related.length > 0 ? (
                    <div className="noteList">
                      {related.filter((item) => item.note).map((item) => (
                        <div key={`${item.id}-note`} className="noteCard">
                          <strong>{item.text}</strong>
                          <span>{item.note}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}
