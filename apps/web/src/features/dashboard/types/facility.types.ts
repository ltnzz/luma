import type { Facility } from '../../../lib/api'

export type FacilityItem = Facility

export interface FacilitiesFilterParams {
  wilayah?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface FacilitiesPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface FacilitiesResponse {
  data: Facility[]
  pagination?: FacilitiesPagination
  source?: string
}
