import { useParams } from 'react-router-dom';

export default function Reader() {
  const { id } = useParams<{ id: string }>();

  return (
    <section>
      <h1>{id ?? 'Episode'}</h1>
    </section>
  );
}
