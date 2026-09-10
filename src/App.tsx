import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { EpisodesProvider } from './hooks/useEpisodes';
import Home from './routes/Home';
import Journey from './routes/Journey';
import Reader from './routes/Reader';
import Timeline from './routes/Timeline';
import Explore from './routes/Explore';
import Library from './routes/Library';
import People from './routes/People';
import Themes from './routes/Themes';

export default function App() {
  return (
    <EpisodesProvider>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="journey" element={<Journey />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="explore" element={<Explore />} />
            <Route path="library" element={<Library />} />
            <Route path="people" element={<People />} />
            <Route path="themes" element={<Themes />} />
            <Route path="episode/:id" element={<Reader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </EpisodesProvider>
  );
}
