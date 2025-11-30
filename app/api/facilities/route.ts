import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const HOSPITALS_FILE = path.join(process.cwd(), 'public', 'hospitals.json')

type Feature = any

async function readData() {
  const raw = await fs.readFile(HOSPITALS_FILE, 'utf-8')
  return JSON.parse(raw)
}

async function writeData(json: any) {
  await fs.writeFile(HOSPITALS_FILE, JSON.stringify(json, null, 2), 'utf-8')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = (url.searchParams.get('search') || '').toLowerCase()
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  try {
    const data = await readData()
    const features: Feature[] = data.features || []

    let filtered = features
    if (search) {
      filtered = features.filter((f: Feature) => {
        const props = f.properties || {}
        const name = (props.name || '').toString().toLowerCase()
        const amen = (props.amenity || '').toString().toLowerCase()
        const health = (props.healthcare || '').toString().toLowerCase()
        return name.includes(search) || amen.includes(search) || health.includes(search)
      })
    }

    const totalDocs = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
    const start = (page - 1) * limit
    const docs = filtered.slice(start, start + limit).map((f: Feature, idx: number) => ({
      _id: f.properties?.osm_id ?? `generated_${start + idx}`,
      ...f,
    }))

    return NextResponse.json({ docs, totalDocs, limit, page, totalPages })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read facilities' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Very small admin guard - expects header Authorization: Bearer <token>
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = auth.replace('Bearer ', '').trim()
  // For local/dev: accept token 'admin' or any non-empty string when NEXT_PUBLIC_DEV_ALLOW_CREATE=1
  const allowDev = process.env.NEXT_PUBLIC_DEV_ALLOW_CREATE === '1'
  if (token !== 'admin' && !allowDev) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    // Expect a GeoJSON Feature
    if (!body || body.type !== 'Feature' || !body.geometry) {
      return NextResponse.json({ error: 'Invalid feature body' }, { status: 400 })
    }

    const data = await readData()
    const features: Feature[] = data.features || []

    // Add osm_id if not present
    const nextId = Date.now()
    body.properties = body.properties || {}
    body.properties.osm_id = body.properties.osm_id || nextId

    features.push(body)
    data.features = features
    await writeData(data)

    return NextResponse.json(body, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 })
  }
}
