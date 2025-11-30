"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type Feature = any

export default function FacilitiesAdmin() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Feature[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Feature | null>(null)
  const [creating, setCreating] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createLat, setCreateLat] = useState('')
  const [createLng, setCreateLng] = useState('')
  const [adminToken, setAdminToken] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => fetchResults(), 250)
    return () => clearTimeout(timeout)
  }, [search, page])

  async function fetchResults() {
    const q = new URLSearchParams({ search, limit: String(limit), page: String(page) })
    const res = await fetch(`/api/facilities?${q.toString()}`)
    const json = await res.json()
    setResults(json.docs || [])
    setTotal(json.totalDocs || 0)
  }

  async function fetchById(id: string) {
    const res = await fetch(`/api/facilities/${id}`)
    const json = await res.json()
    setSelected(json)
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const feature = {
        type: 'Feature',
        properties: { name: createName },
        geometry: { type: 'Point', coordinates: [parseFloat(createLng), parseFloat(createLat)] },
      }

      const res = await fetch('/api/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(feature),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }))
        alert('Create failed: ' + (err.error || res.statusText))
      } else {
        alert('Facility created')
        setCreateName('')
        setCreateLat('')
        setCreateLng('')
        fetchResults()
      }
    } catch (err) {
      alert('Create error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facilities Admin</CardTitle>
          <CardDescription>Search and create facility records (backed by public/hospitals.json)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <Input placeholder="Search facilities..." value={search} onChange={(e: any) => { setSearch(e.target.value); setPage(1) }} />
            <Button onClick={() => { setSearch(''); setPage(1) }}>Clear</Button>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Results ({total})</h3>
              <div className="space-y-2 max-h-[480px] overflow-auto">
                {results.map(r => (
                  <div key={r.properties?.osm_id || Math.random()} className="p-2 border rounded hover:bg-muted/50 cursor-pointer" onClick={() => fetchById(String(r.properties?.osm_id || ''))}>
                    <div className="font-medium">{r.properties?.name || '—'}</div>
                    <div className="text-sm text-muted-foreground">{r.properties?.addr_city || r.properties?.amenity || r.properties?.healthcare}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                <div>Page {page}</div>
                <Button disabled={(page * limit) >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>

            <div className="col-span-2">
              <h3 className="font-medium mb-2">Details</h3>
              {selected ? (
                <div className="p-4 border rounded space-y-2">
                  <div><strong>Name:</strong> {selected.properties?.name}</div>
                  <div><strong>City:</strong> {selected.properties?.addr_city}</div>
                  <div><strong>Amenity:</strong> {selected.properties?.amenity}</div>
                  <div><strong>Coordinates:</strong> {selected.geometry?.coordinates?.join(', ')}</div>
                </div>
              ) : (
                <div className="p-4 border rounded text-sm text-muted-foreground">Select a facility to see details</div>
              )}

              <Separator className="my-4" />

              <h3 className="font-medium mb-2">Create Facility</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Name" value={createName} onChange={(e: any) => setCreateName(e.target.value)} />
                <Input placeholder="Latitude" value={createLat} onChange={(e: any) => setCreateLat(e.target.value)} />
                <Input placeholder="Longitude" value={createLng} onChange={(e: any) => setCreateLng(e.target.value)} />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Note: to create a facility provide an admin token. For local dev you can use token <code>admin</code>.</div>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Admin token" value={adminToken} onChange={(e: any) => setAdminToken(e.target.value)} />
                <Button onClick={handleCreate} disabled={creating}>Create</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
