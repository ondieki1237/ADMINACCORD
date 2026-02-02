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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  try {
    const id = params.id
    const data = await readData()
    const documents = data.documents || []
    const idx = documents.findIndex((d: any) => String(d._id) === String(id))
    if (idx === -1) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    documents.splice(idx, 1)
    data.documents = documents
    await writeData(data)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to delete document' }, { status: 500 })
  }
}
