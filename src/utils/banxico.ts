export async function fetchExchangeRate(): Promise<number> {
  const token = import.meta.env.VITE_BANXICO_TOKEN as string
  if (!token) {
    throw new Error('VITE_BANXICO_TOKEN no está configurado en las variables de entorno')
  }

  const url =
    'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno'

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'Bmx-Token': token,
      },
    })
  } catch (err) {
    throw new Error(`Error de red al consultar Banxico: ${String(err)}`)
  }

  if (!response.ok) {
    throw new Error(
      `Banxico respondió con estado ${response.status}: ${response.statusText}`
    )
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new Error('La respuesta de Banxico no es JSON válido')
  }

  try {
    const data = json as {
      bmx: { series: Array<{ datos: Array<{ dato: string }> }> }
    }
    const dato = data.bmx.series[0].datos[0].dato
    const rate = parseFloat(dato)
    if (isNaN(rate)) {
      throw new Error(`El valor del tipo de cambio no es un número: "${dato}"`)
    }
    return rate
  } catch (err) {
    if (err instanceof Error && err.message.includes('tipo de cambio')) throw err
    throw new Error(
      'No se pudo parsear la respuesta de Banxico. Estructura inesperada.'
    )
  }
}
