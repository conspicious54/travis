import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './bullion/pages/Home';
import { News } from './bullion/pages/News';
import { Markets } from './bullion/pages/Markets';
import { About } from './bullion/pages/About';

function AppWrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWrapper;
