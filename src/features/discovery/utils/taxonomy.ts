import { ALL_SERVICES, JUGNU_CATEGORIES } from '@kaamgar/shared'
import type { PopularSearchItem } from '../types'

// Popular search issue chips for quick selection
export const POPULAR_SEARCHES: PopularSearchItem[] = [
  { labelKey: 'home.popularSwitchboard', category: 'electrician' },
  { labelKey: 'home.popularAc', category: 'ac_repair' },
  { labelKey: 'home.popularPipe', category: 'plumber' },
  { labelKey: 'home.popularMaid', category: 'part_time_maid' },
  { labelKey: 'home.popularParlour', category: 'parlour_service' },
  { labelKey: 'home.popularFurniture', category: 'carpenter' },
  { labelKey: 'home.popularPaint', category: 'painter' },
  { labelKey: 'home.popularCar', category: 'car_mechanic' },
]

// Common query aliases mapping to canonical service IDs in @kaamgar/shared
export const SERVICE_ALIASES: Record<string, string[]> = {
  parlour: ['parlour_service'],
  parlor: ['parlour_service'],
  salon: ['parlour_service'],
  beauty: ['parlour_service', 'nail_extension', 'mehendi_artist'],
  makeup: ['parlour_service'],
  facial: ['parlour_service'],
  waxing: ['parlour_service'],
  hair: ['parlour_service'],
  mehendi: ['mehendi_artist'],
  mehndi: ['mehendi_artist'],
  henna: ['mehendi_artist'],
  nail: ['nail_extension'],
  nails: ['nail_extension'],
  ac: ['ac_repair'],
  'ac repair': ['ac_repair'],
  'ac service': ['ac_repair'],
  aircon: ['ac_repair'],
  cool: ['ac_repair', 'refrigerator_repair'],
  fridge: ['refrigerator_repair'],
  refrigerator: ['refrigerator_repair'],
  washing: ['washing_machine_repair'],
  'washing machine': ['washing_machine_repair'],
  laundry: ['dry_clean_press', 'part_time_maid'],
  iron: ['dry_clean_press'],
  press: ['dry_clean_press'],
  maid: ['part_time_maid'],
  cleaning: ['part_time_maid'],
  cook: ['part_time_maid'],
  plumber: ['plumber'],
  pipe: ['plumber'],
  leak: ['plumber'],
  leakage: ['plumber'],
  tap: ['plumber'],
  water: ['plumber', 'ro_repair'],
  ro: ['ro_repair'],
  geyser: ['geyser_repair'],
  heater: ['geyser_repair'],
  electrician: ['electrician'],
  electric: ['electrician'],
  wiring: ['electrician'],
  switch: ['electrician'],
  switchboard: ['electrician'],
  mcb: ['electrician'],
  fan: ['electrician'],
  light: ['electrician'],
  carpenter: ['carpenter'],
  furniture: ['carpenter'],
  wood: ['carpenter'],
  door: ['carpenter'],
  lock: ['carpenter'],
  painter: ['painter'],
  paint: ['painter'],
  painting: ['painter'],
  wall: ['painter', 'raj_mistri'],
  mechanic: ['car_mechanic'],
  car: ['car_mechanic', 'part_time_driver'],
  vehicle: ['car_mechanic', 'part_time_driver'],
  auto: ['car_mechanic'],
  driver: ['part_time_driver'],
  ambulance: ['ambulance'],
  emergency: ['ambulance'],
  mason: ['raj_mistri'],
  mistri: ['raj_mistri', 'daily_wage_worker'],
  mazdoor: ['daily_wage_worker'],
  labour: ['daily_wage_worker'],
  // Hindi aliases
  बिजली: ['electrician'],
  प्लंबर: ['plumber'],
  बढ़ई: ['carpenter'],
  पेंटर: ['painter'],
  पार्लर: ['parlour_service'],
  मेहंदी: ['mehendi_artist'],
  सफाई: ['part_time_maid'],
  कामवाली: ['part_time_maid'],
  ड्राइवर: ['part_time_driver'],
  मैकेनिक: ['car_mechanic'],
  एसी: ['ac_repair'],
  फ्रिज: ['refrigerator_repair'],
  गीजर: ['geyser_repair'],
}

export function getMatchingTaxonomyServiceIds(query: string): Set<string> {
  const q = query.trim().toLowerCase()
  const matched = new Set<string>()
  if (!q) return matched

  // 1. Check direct service name & id matches
  for (const s of ALL_SERVICES) {
    const en = s.name_en.toLowerCase()
    const hi = s.name_hi.toLowerCase()
    const idClean = s.id.replace(/_/g, ' ').toLowerCase()
    if (
      s.id.toLowerCase().includes(q) ||
      idClean.includes(q) ||
      q.includes(idClean) ||
      en.includes(q) ||
      q.includes(en) ||
      hi.includes(q)
    ) {
      matched.add(s.id)
    }
  }

  // 2. Check category group name & id matches
  for (const c of JUGNU_CATEGORIES) {
    const en = c.name_en.toLowerCase()
    const hi = c.name_hi.toLowerCase()
    const idClean = c.id.replace(/_/g, ' ').toLowerCase()
    if (
      c.id.toLowerCase().includes(q) ||
      idClean.includes(q) ||
      en.includes(q) ||
      hi.includes(q)
    ) {
      matched.add(c.id)
      for (const s of c.services) {
        matched.add(s.id)
      }
    }
  }

  // 3. Check synonym / alias mappings (ensuring short aliases like 'ac', 'car' respect word boundaries)
  const tokens = q.split(/\s+/)
  for (const [aliasWord, serviceIds] of Object.entries(SERVICE_ALIASES)) {
    const isShort = aliasWord.length <= 3
    const matchedAlias = isShort
      ? tokens.includes(aliasWord) || new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F])${aliasWord}([^a-zA-Z0-9\u0900-\u097F]|$)`, 'i').test(q)
      : (q.includes(aliasWord) || aliasWord.includes(q))

    if (matchedAlias) {
      for (const sid of serviceIds) {
        matched.add(sid)
      }
    }
  }

  return matched
}
