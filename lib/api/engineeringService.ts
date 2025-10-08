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

export async function assignService(serviceId: string, payload: any) {
  return apiService.assignEngineeringService(serviceId, payload)
}

export default { listServices, listServicesByEngineer, getServiceById, assignService }
