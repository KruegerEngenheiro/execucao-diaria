// Aplica o tema (claro, escuro ou do sistema) no elemento raiz.
import { useEffect } from 'react'
import type { Config } from '../types'

export function aplicarTema(tema: Config['tema']) {
  const raiz = document.documentElement
  if (tema === 'sistema') {
    const escuro = window.matchMedia('(prefers-color-scheme: dark)').matches
    raiz.setAttribute('data-tema', escuro ? 'escuro' : 'claro')
  } else {
    raiz.setAttribute('data-tema', tema)
  }
}

export function useTema(tema: Config['tema'] | undefined) {
  useEffect(() => {
    if (!tema) return
    aplicarTema(tema)
    if (tema === 'sistema') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const h = () => aplicarTema('sistema')
      mq.addEventListener('change', h)
      return () => mq.removeEventListener('change', h)
    }
  }, [tema])
}
