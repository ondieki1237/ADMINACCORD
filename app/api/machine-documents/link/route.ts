import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const DATA_FILE = path.join(process.cwd(), 'public', 'machine-documents.json')

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

export async function POST(request: Request) {
  // Accept JSON link creation; admin only
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body || !body.title || !body.linkUrl) {
      return NextResponse.json({ success: false, message: 'Missing title or linkUrl' }, { status: 400 })
    }

    const data = await readData()
    const documents = data.documents || []
    const newDoc = {
      _id: String(Date.now()),
      title: String(body.title),
      type: 'link',
      linkUrl: String(body.linkUrl),
      categoryId: body.categoryId || null,
      manufacturerId: body.manufacturerId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    documents.push(newDoc)
    data.documents = documents
    await writeData(data)
    return NextResponse.json({ success: true, data: newDoc }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to create document link' }, { status: 500 })
  }
}
