export interface Project {
  id?: number
  name: string
  createdAt: Date
  updatedAt: Date
}

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'

export interface FilterPreset {
  field: string
  operator: FilterOperator
  value: string | number | string[]
}

export interface SmartPlaylist {
  id?: number
  projectId: number
  name: string
  filters: FilterPreset[]
}
