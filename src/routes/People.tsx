import { IndexPage } from '../components/IndexPage';

export default function People() {
  return (
    <IndexPage
      kind="person"
      eyebrow="WHO'S WHO"
      title="People of Genesis"
      intro="Every person introduced across the journey, and the episodes where their story unfolds. Drawn from the character profiles in each experience."
      select={(index) => index.people}
    />
  );
}
