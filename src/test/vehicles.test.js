import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

describe('vehicle management visibility', () => {
  it('does not expose vehicle creation in the administrator page', () => {
    const adminPage = source('../pages/admin/AdminVehiclesPage.jsx')
    expect(adminPage).not.toContain('Adicionar Viatura')
    expect(adminPage).not.toContain('createVehicle')
  })

  it('keeps vehicle creation available to the driver without driver_id', () => {
    const driverPage = source('../pages/driver/DriverDashboard.jsx')
    expect(driverPage).toContain('Adicionar Viatura')
    expect(driverPage).not.toMatch(/createVehicle\(\{[^}]*driver_id/s)
  })
})