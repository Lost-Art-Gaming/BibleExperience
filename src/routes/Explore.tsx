import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtifactStage } from '../components/ArtifactStage';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { useEpisodes } from '../hooks/useEpisodes';
import { ARTIFACTS, isArtifactUnlocked } from '../lib/artifacts';
import { cleanTitle, isDone } from '../lib/storage';

/**
 * The Collection — the geography and buildings of Genesis as miniature
 * dioramas, each uncovered by completing the episode that tells its story.
 */
export default function Explore() {
  const { episodes } = useEpisodes();
  const navigate = useNavigate();

  const unlocked = useMemo(() => ARTIFACTS.filter((a) => isArtifactUnlocked(a, isDone)), [episodes]);
  const [openId, setOpenId] = useState<string | null>(null);

  const selected = openId ? ARTIFACTS.find((a) => a.id === openId) : unlocked[0];
  const titleOf = (episodeId: string) => {
    const meta = episodes.find((e) => e.id === episodeId);
    return meta ? cleanTitle(meta.title) : 'its episode';
  };

  return (
    <>
      <section className="page-intro compact">
        <span className="eyebrow">THE COLLECTION</span>
        <h1>What you have uncovered.</h1>
        <p>
          The places and the structures of Genesis, modelled to the proportions given in Scripture. Each is uncovered by
          completing the experience that tells its story.
        </p>
      </section>

      <div className="collection-meter">
        <span className="collection-count">{unlocked.length}</span>
        <span>
          of {ARTIFACTS.length} uncovered
        </span>
        <span className="collection-bar" aria-hidden="true">
          <i style={{ width: `${(unlocked.length / ARTIFACTS.length) * 100}%` }} />
        </span>
      </div>

      {selected ? (
        <ArtifactStage key={selected.id} artifact={selected} />
      ) : (
        <section className="collection-empty">
          <h2>Nothing uncovered yet</h2>
          <p>
            Complete an experience and the place or structure at its heart is modelled here — beginning with the garden
            of Eden.
          </p>
          <button className="primary-btn" onClick={() => navigate('/journey')}>
            <Icon name="play" /> Continue the journey
          </button>
        </section>
      )}

      <section className="collection-grid" aria-label="Artifacts">
        {ARTIFACTS.map((artifact, i) => {
          const open = isArtifactUnlocked(artifact, isDone);
          const isSelected = selected?.id === artifact.id;
          return (
            <Reveal key={artifact.id} delay={Math.min(i, 6) * 50}>
              <button
                className={`artifact-card${open ? '' : ' sealed'}${isSelected ? ' selected' : ''}`}
                data-artifact={artifact.id}
                disabled={!open}
                aria-disabled={!open}
                onClick={open ? () => setOpenId(artifact.id) : undefined}
              >
                <span className={`artifact-kind ${artifact.kind}`}>{artifact.kind === 'place' ? 'Place' : 'Building'}</span>
                <b>{open ? artifact.name : 'Sealed'}</b>
                <small>
                  {open ? artifact.citation : `Complete “${titleOf(artifact.episode)}” to uncover this.`}
                </small>
                {open ? (
                  <em>{isSelected ? 'Showing' : 'View model'}</em>
                ) : (
                  <em className="artifact-locked">
                    <Icon name="bookmark" /> Locked
                  </em>
                )}
              </button>
            </Reveal>
          );
        })}
      </section>
    </>
  );
}
