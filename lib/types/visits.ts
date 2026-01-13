export interface UserRef {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  employeeId?: string
  region?: string
}

export interface Client {
  name?: string
  type?: string
  level?: string
  location?: string
}

export interface Contact {
  name?: string
  role?: string
  phone?: string
  email?: string
}

export interface Visit {
  _id?: string
  userId?: UserRef | string
  visitId?: string
  date?: string
  startTime?: string
  endTime?: string
  duration?: number
  client?: Client
  contacts?: Contact[]
  productsOfInterest?: string[]
  existingEquipment?: string[]
  requestedEquipment?: string[]
  visitPurpose?: string
  visitOutcome?: string
  competitorActivity?: string
  marketInsights?: string
  notes?: string
  customData?: Record<string, any>
  nextVisitDate?: string | null
  attachments?: any[]
  photos?: any[]
  tags?: string[]
  isFollowUpRequired?: boolean
  followUpActions?: any[]
  followUpVisits?: Visit[]
  syncedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface VisitsMeta {
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface VisitsResponse {
  success: true
  data: Visit[]
  meta?: VisitsMeta
  summary?: any
}

export interface VisitsSummaryItem {
  userId: string
  visitsCount: number
  lastVisit: string
  user: UserRef
}
