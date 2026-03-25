import { Reader } from '@/components/reader';

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="page stackGap pagePadBottom">
      <Reader bookId={id} />
    </section>
  );
}
