// Tick de 1 segundo, para o cronometro vivo e o estado "agora" da timeline.
import { useEffect, useState } from 'react'

export function useRelogio(ativo = true, intervaloMs = 1000): number {
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    if (!ativo) return
    const id = setInterval(() => setAgora(Date.now()), intervaloMs)
    return () => clearInterval(id)
  }, [ativo, intervaloMs])
  return agora
}
