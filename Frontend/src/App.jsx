import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/property/:id" element={<PropertyDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;