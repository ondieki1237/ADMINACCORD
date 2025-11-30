import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const HOSPITALS_FILE = path.join(process.cwd(), 'public', 'hospitals.json')

async function readData() {
  const raw = await fs.readFile(HOSPITALS_FILE, 'utf-8')
  return JSON.parse(raw)
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  try {
    const data = await readData()
    const features = data.features || []
    const found = features.find((f: any) => {
      const osm = f.properties?.osm_id?.toString()
      return osm === id || f._id === id
    })

    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(found)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read facility' }, { status: 500 })
  }
}
