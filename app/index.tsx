// app/index.tsx
import { AuthProvider } from '../contexts/AuthContext';
import Vibes from '../components/Vibes';
import Login from '../components/Login';
import { useAuth } from '~/contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isGuest } = useAuth();
  return isAuthenticated || isGuest ? <Vibes /> : <Login />;
};

export default App;
