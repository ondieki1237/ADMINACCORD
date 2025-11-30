import FacilitiesAdmin from '@/components/dashboard/facilities-admin'

export const metadata = {
  title: 'Facilities Admin',
}

export default function Page() {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold mb-4">Facilities</h1>
      <FacilitiesAdmin />
    </section>
  )
}
