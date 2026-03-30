export async function fetchExchangeRate(): Promise<number> {
  const baseUrl = import.meta.env.VITE_INSFORGE_URL as string

  let response: Response
  try {
    response = await fetch(`${baseUrl}/functions/banxico-rate`, {
      headers: {
        apikey: import.meta.env.VITE_INSFORGE_API_KEY as string,
      },
    })
  } catch (err) {
    throw new Error(`Error de red al consultar Banxico: ${String(err)}`)
  }

  if (!response.ok) {
    throw new Error(`Error al obtener tipo de cambio (${response.status})`)
  }

  const json = await response.json() as { rate?: number; error?: string }

  if (json.error) {
    throw new Error(`Error de Banxico: ${json.error}`)
  }

  if (typeof json.rate !== 'number') {
    throw new Error('Respuesta inesperada de la función de tipo de cambio')
  }

  return json.rate
}
