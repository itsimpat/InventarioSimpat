export default async function handler(req: Request): Promise<Response> {
  const token = Deno.env.get('BANXICO_TOKEN')
  if (!token) {
    return Response.json({ error: 'BANXICO_TOKEN not configured' }, { status: 500 })
  }

  const url = 'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno'

  let banxicoRes: Response
  try {
    banxicoRes = await fetch(url, { headers: { 'Bmx-Token': token } })
  } catch (err) {
    return Response.json({ error: `Network error: ${String(err)}` }, { status: 502 })
  }

  if (!banxicoRes.ok) {
    return Response.json(
      { error: `Banxico responded ${banxicoRes.status}` },
      { status: 502 }
    )
  }

  const data = await banxicoRes.json()

  try {
    const dato = data.bmx.series[0].datos[0].dato
    const rate = parseFloat(dato)
    if (isNaN(rate)) throw new Error('invalid rate')
    return Response.json({ rate })
  } catch {
    return Response.json({ error: 'Unexpected Banxico response structure' }, { status: 502 })
  }
}
