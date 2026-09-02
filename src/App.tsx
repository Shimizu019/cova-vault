import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useThemeSync } from './lib/hooks/useThemeSync';

function AppContent() {
  useThemeSync();
  return <AppRoutes />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;