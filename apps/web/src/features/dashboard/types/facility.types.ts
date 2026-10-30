export interface FacilityItem {
  id: string
  slug?: string
  name: string
  category: 'fasum' | 'kesehatan' | 'pendidikan' | 'transum' | 'lingkungan' | string
  subCategory: string
  wilayah: string
  kecamatan?: string | null
  address?: string | null
  lat: number
  lng: number
  specs?: Record<string, string>
  budget?: {
    total?: string | null
    source?: string | null
    year?: string | null
    contractor?: string | null
    status?: string | null
  }
  metrics?: {
    aqi?: number | null
    aqiStatus?: string | null
    pm25?: string | null
    walkability?: string | null
    transitAccess?: string | null
  }
  documents?: Array<{
    title: string
    size?: string | null
    dept?: string | null
    fileUrl?: string | null
  }>
  docs?: Array<{
    title: string
    size?: string | null
    dept?: string | null
    file_url?: string | null
  }>
}

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
  data: FacilityItem[]
  pagination?: FacilitiesPagination
  source?: string
}

