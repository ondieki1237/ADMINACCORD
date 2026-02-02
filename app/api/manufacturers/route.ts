import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const DATA_FILE = path.join(process.cwd(), 'public', 'manufacturers.json')

async function readData() {
  const raw = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(raw)
}

async function writeData(json: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(json, null, 2), 'utf-8')
}

function isAdmin(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return false
  const token = auth.replace('Bearer ', '').trim()
  const allowDev = process.env.NEXT_PUBLIC_DEV_ALLOW_CREATE === '1'
  return token === 'admin' || allowDev
}

export async function GET(request: Request) {
  try {
    const data = await readData()
    const manufacturers = data.manufacturers || []
    return NextResponse.json({ success: true, data: manufacturers })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to read manufacturers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body || !body.name) return NextResponse.json({ success: false, message: 'Missing name' }, { status: 400 })

    const data = await readData()
    const manufacturers = data.manufacturers || []
    const newMan = {
      _id: String(Date.now()),
      name: String(body.name),
      country: body.country || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    manufacturers.push(newMan)
    data.manufacturers = manufacturers
    await writeData(data)
    return NextResponse.json({ success: true, data: newMan }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to create manufacturer' }, { status: 500 })
  }
}
