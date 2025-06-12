import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ListaImoveis from './pages/ListaImoveis';
import DetalhesImovel from './pages/DetalhesImovel';
import CadastroImovel from './pages/CadastroImovel';
import EditarImovel from './pages/EditarImovel';
import Configuracoes from './pages/Configuracoes';
import Documentos from './pages/Documentos';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Rota pública para login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas que requerem autenticação */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="imoveis" element={<ListaImoveis />} />
            <Route path="imoveis/cadastro" element={<CadastroImovel />} />
            <Route path="imoveis/:id" element={<DetalhesImovel />} />
            <Route path="imoveis/:id/editar" element={<EditarImovel />} />
            
            {/* Rota de documentos */}
            <Route path="documentos" element={<Documentos />} />
            
            {/* Rota de configurações - apenas para administradores */}
            <Route path="configuracoes" element={
              <ProtectedRoute adminOnly={true}>
                <Configuracoes />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;