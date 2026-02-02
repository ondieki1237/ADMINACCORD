import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const DATA_FILE = path.join(process.cwd(), 'public', 'machine-documents.json')

async function readData() {
  const raw = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(raw)
}

export async function GET(request: Request) {
  try {
    const data = await readData()
    const documents = data.documents || []
    return NextResponse.json({ success: true, data: documents })
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to read documents' }, { status: 500 })
  }
}
