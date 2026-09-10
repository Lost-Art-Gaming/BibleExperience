import { TapestryView } from '../components/TapestryView';

export default function Tapestry() {
  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">THE TAPESTRY</span>
        <h1>The threads you&#8217;ve woven</h1>
        <p>
          A growing map of how the story connects. Complete an episode and it lights up, weaving in the themes and
          people it shares with the experiences you&#8217;ve already discovered. Every thread is drawn from the
          episodes&#8217; own text.
        </p>
      </section>
      <TapestryView />
    </>
  );
}
