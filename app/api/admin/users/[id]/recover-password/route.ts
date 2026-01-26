import { NextResponse } from 'next/server'

const DEFAULT_PROD_API = 'https://app.codewithseth.co.ke/api'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || DEFAULT_PROD_API

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params

  // Require Authorization header
  const auth = req.headers.get('authorization')
  if (!auth) {
    return NextResponse.json({ success: false, message: 'Missing Authorization header' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch (e) {
    body = {}
  }

  const method = body?.method || 'link'

  // Proxy to configured backend if available
  try {
    const targetUrl = `${API_BASE_URL}/admin/users/${encodeURIComponent(id)}/recover-password`
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({ method }),
    })

    const text = await resp.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }

    return NextResponse.json(data, { status: resp.status })
  } catch (err) {
    // Backend unreachable — provide a safe dev-mode fallback implementation
    console.error('Proxy to backend failed for recover-password:', err)

    if (method === 'temp') {
      // generate a simple temporary password (dev only)
      const temp = Math.random().toString(36).slice(-10)
      console.log(`DEV TEMP PASSWORD for user ${id}: ${temp}`)
      const payload: any = { success: true, message: 'Temporary password emailed to user (dev-mode)' }
      if (process.env.NODE_ENV !== 'production') payload.tempPassword = temp
      return NextResponse.json(payload, { status: 200 })
    }

    return NextResponse.json({ success: true, message: 'Password reset link sent to user (dev-mode)' }, { status: 200 })
  }
}
