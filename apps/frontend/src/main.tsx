import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import './i18n' // Inicializar i18n ANTES de renderizar

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)