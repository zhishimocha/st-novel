'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { parseJsonlToBook } from '@/lib/parser';
import { emptyLibrary, readLibrary, writeLibrary } from '@/lib/storage';
import { Book, Chapter, Highlight, LibraryData, SearchMatch } from '@/lib/types';
import { formatDate, getMonthKey, uid } from '@/lib/utils';

type ContextValue = {
  data: LibraryData;
  books: Book[];
  chapters: Chapter[];
  highlights: Highlight[];
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  importJsonl: (file: File, cover?: string) => Promise<Book>;
  exportLibrary: () => void;
  getBookById: (bookId: string) => Book | undefined;
  getChaptersByBookId: (bookId: string) => Chapter[];
  getHighlightsByBookId: (bookId: string) => Highlight[];
  addHighlight: (payload: Omit<Highlight, 'id' | 'createdAt'>) => void;
  removeHighlight: (highlightId: string) => void;
  searchBook: (bookId: string, query: string) => SearchMatch[];
  getMonthlyImportCount: (year: number, month: number) => number;
  getBooksOnDate: (date: string) => Book[];
  hasBooksOnDate: (date: string) => boolean;
};

const LibraryContext = createContext<ContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LibraryData>(emptyLibrary());

  useEffect(() => {
    const saved = readLibrary();
    setData(saved);
  }, []);

  useEffect(() => {
    writeLibrary(data);
    document.documentElement.dataset.theme = data.theme;
  }, [data]);

  const importJsonl = async (file: File, cover?: string) => {
    const text = await file.text();
    const { book, chapter } = parseJsonlToBook(text, cover);
    setData((prev) => ({
      ...prev,
      books: [book, ...prev.books],
      chapters: [chapter, ...prev.chapters],
    }));
    return book;
  };

  const exportLibrary = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `role-novel-library-${formatDate(new Date().toISOString())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setTheme = (theme: 'dark' | 'light') => {
    setData((prev) => ({ ...prev, theme }));
  };

  const getBookById = (bookId: string) => data.books.find((book) => book.id === bookId);

  const getChaptersByBookId = (bookId: string) => {
    const book = getBookById(bookId);
    if (!book) return [];
    return book.chapterIds
      .map((chapterId) => data.chapters.find((chapter) => chapter.id === chapterId))
      .filter(Boolean) as Chapter[];
  };

  const getHighlightsByBookId = (bookId: string) => data.highlights.filter((item) => item.bookId === bookId);

  const addHighlight = (payload: Omit<Highlight, 'id' | 'createdAt'>) => {
    setData((prev) => ({
      ...prev,
      highlights: [
        {
          ...payload,
          id: uid('hl'),
          createdAt: new Date().toISOString(),
        },
        ...prev.highlights,
      ],
    }));
  };

  const removeHighlight = (highlightId: string) => {
    setData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((item) => item.id !== highlightId),
    }));
  };

  const searchBook = (bookId: string, query: string) => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    const chapters = getChaptersByBookId(bookId);
    const results: SearchMatch[] = [];

    chapters.forEach((chapter) => {
      chapter.messages.forEach((message) => {
        const text = message.content.toLowerCase();
        const index = text.indexOf(q);
        if (index > -1) {
          const start = Math.max(0, index - 16);
          const end = Math.min(message.content.length, index + q.length + 18);
          results.push({
            bookId,
            chapterId: chapter.id,
            messageId: message.id,
            preview: message.content.slice(start, end),
            index,
          });
        }
      });
    });

    return results;
  };

  const getMonthlyImportCount = (year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return data.books.filter((book) => getMonthKey(book.importedAt) === key).length;
  };

  const getBooksOnDate = (date: string) => data.books.filter((book) => formatDate(book.importedAt) === date);
  const hasBooksOnDate = (date: string) => getBooksOnDate(date).length > 0;

  const value = useMemo<ContextValue>(() => ({
    data,
    books: data.books,
    chapters: data.chapters,
    highlights: data.highlights,
    theme: data.theme,
    setTheme,
    importJsonl,
    exportLibrary,
    getBookById,
    getChaptersByBookId,
    getHighlightsByBookId,
    addHighlight,
    removeHighlight,
    searchBook,
    getMonthlyImportCount,
    getBooksOnDate,
    hasBooksOnDate,
  }), [data]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}
