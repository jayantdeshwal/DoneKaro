export interface LiveWorkerDetails {
  bio: string
  experience_years: number
  approval_status: 'pending' | 'approved' | 'rejected'
  is_available: boolean
  rating: number
  review_count: number
  rejection_reason: string | null
  categories: string[]
  areas: string[]
  completedJobsCount: number
  id_proof_url: string | null
}

export interface ProfileFormData {
  name: string
  phone: string
  email: string
  language: 'en' | 'hi'
  avatar_url: string
  bio: string
  experience_years: number
  category: string
  areas: string[]
  is_available: boolean
  id_proof_url: string
}
