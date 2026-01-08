"use client"

import dynamic from 'next/dynamic'

const SalesHeatmap = dynamic(() => import('@/components/dashboard/sales-heatmap'), {
  ssr: false,
})

export default function SalesHeatmapPage() {
  return (
    <div className="p-6">
      <SalesHeatmap />
    </div>
  )
}