'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLibrary } from './library-context';

export function ImportPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const coverRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { importJsonl } = useLibrary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cover, setCover] = useState<string | undefined>(undefined);

  async function onImport() {
    const file = inputRef.current?.files?.[0];
    if (!file) return setError('先选一个 jsonl 文件。');
    setError('');
    setLoading(true);
    try {
      const book = await importJsonl(file, cover);
      router.push(`/book/${book.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败。');
    } finally {
      setLoading(false);
    }
  }

  function onCoverChange() {
    const file = coverRef.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCover(typeof reader.result === 'string' ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  return (
    <section className="card stackGap">
      <div>
        <h2>导入新小说</h2>
        <p className="muted">上传酒馆导出的 jsonl。每次导入都会生成一本小说。</p>
      </div>
      <label className="inputLabel">
        <span>聊天记录文件</span>
        <input ref={inputRef} type="file" accept=".jsonl" />
      </label>
      <label className="inputLabel">
        <span>封面图（可选）</span>
        <input ref={coverRef} type="file" accept="image/*" onChange={onCoverChange} />
      </label>
      <button className="primaryButton" onClick={onImport} type="button" disabled={loading}>
        {loading ? '导入中…' : '导入成小说'}
      </button>
      {error ? <p className="errorText">{error}</p> : null}
    </section>
  );
}
