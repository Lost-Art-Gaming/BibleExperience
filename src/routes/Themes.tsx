import { IndexPage } from '../components/IndexPage';

export default function Themes() {
  return (
    <IndexPage
      kind="theme"
      eyebrow="THE THREADS"
      title="Themes across Genesis"
      intro="The ideas the account develops — sovereignty, the seed promise, faith, sacred rest — and where each is introduced and returns. Drawn from the major themes of each experience."
      select={(index) => index.themes}
    />
  );
}
