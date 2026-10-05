import type { CategoryWorkerStat, PublicWorker } from '@/services/workers'

export interface PopularSearchItem {
  labelKey: string
  category: string
}

export interface DiscoveryFilterState {
  searchQuery: string
  selectedCategory: string
  selectedArea: string
  isFilterOpen: boolean
}

export type { CategoryWorkerStat, PublicWorker }
