import { apiService } from "../api"

export async function listServices(page = 1, limit = 20, filters: Record<string, any> = {}) {
  return apiService.getEngineeringServices(page, limit, filters)
}

export async function listServicesByEngineer(engineerId: string, page = 1, limit = 50, filters: Record<string, any> = {}) {
  return apiService.getEngineeringServicesByEngineer(engineerId, page, limit, filters)
}

export async function getServiceById(serviceId: string) {
  return apiService.getEngineeringServiceById(serviceId)
}

export async function createService(payload: any) {
  return apiService.createEngineeringService(payload)
}

export async function updateService(serviceId: string, payload: any) {
  return apiService.updateEngineeringService(serviceId, payload)
}

export async function deleteService(serviceId: string) {
  return apiService.deleteEngineeringService(serviceId)
}

export async function assignService(serviceId: string, payload: any) {
  return apiService.assignEngineeringService(serviceId, payload)
}

export async function getEngineers() {
  return apiService.getEngineers()
}

export async function getUsers(filters?: Record<string, any>) {
  return apiService.getUsers(filters || {})
}

export default { 
  listServices, 
  listServicesByEngineer, 
  getServiceById, 
  createService,
  updateService,
  deleteService,
  assignService,
  getEngineers,
  getUsers
}
