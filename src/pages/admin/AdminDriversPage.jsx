import { useEffect, useState } from 'react'
import { getDrivers } from '../../services/driverService'
import AdminLayout from './AdminLayout'
import AdminTable from './AdminTable'
import { getApiErrorMessage, valueOrDash } from './adminUtils'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nome', render: (driver) => valueOrDash(driver.name) },
  { key: 'email', label: 'Email', render: (driver) => valueOrDash(driver.email) },
  {
    key: 'license_number',
    label: 'Licenca',
    render: (driver) => valueOrDash(driver.license_number),
  },
  { key: 'phone', label: 'Telefone', render: (driver) => valueOrDash(driver.phone) },
  { key: 'status', label: 'Estado', render: (driver) => valueOrDash(driver.status) },
]

function AdminDriversPage() {
  const [drivers, setDrivers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    getDrivers()
      .then((data) => {
        if (isMounted) {
          setDrivers(data)
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(getApiErrorMessage(apiError))
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AdminLayout
      eyebrow="Gestao"
      title="Motoristas"
      description="Lista carregada de GET /api/drivers."
    >
      {isLoading ? <div className="admin-state">A carregar motoristas...</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}
      {!isLoading && !error ? (
        <AdminTable columns={columns} data={drivers} emptyMessage="Nenhum motorista encontrado." />
      ) : null}
    </AdminLayout>
  )
}

export default AdminDriversPage
