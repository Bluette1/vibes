// app/index.tsx
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Vibes from '../components/Vibes';
import Login from '../components/Login';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Vibes /> : <Login />;
};

export default App;