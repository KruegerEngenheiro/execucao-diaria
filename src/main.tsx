import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { semearSeNecessario } from './db'
import { aplicarTema } from './hooks/useTema'
import './index.css'

// Tema inicial antes do primeiro render, pra nao piscar.
aplicarTema('sistema')

// Semeia o banco (categorias, rotina, config) na primeira vez e so entao monta o app.
semearSeNecessario().finally(() => {
  const el = document.getElementById('root')!
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
