import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export enum MissionType {
  NORMAL = 'NORMAL',
  SPECIAL = 'SPECIAL',
}

export enum DailyMissionStatus {
  ARRIVED = 'ARRIVED',
  CONFIRMED = 'CONFIRMED',
}

export const MIN_SELECTABLE = 1
export const MAX_SELECTABLE = 5
export const CANDIDATE_COUNT = 10
export const SPECIAL_PROBABILITY = 0.03
export const MEMO_MAX_LENGTH = 200
export const MYLOG_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const MYLOG_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

const KST = 'Asia/Seoul'

export function getMissionDate(now: Date): string {
  return dayjs(now).tz(KST).format('YYYY-MM-DD')
}

export function dailySeed(userId: number | null, missionDate: string): number {
  const key = `${userId ?? 'guest'}|${missionDate}`
  return fnv1a32(key)
}

function fnv1a32(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export interface SampleableMission {
  id: number
  type: MissionType
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: readonly T[], rand: () => number): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function sampleCandidates<T extends SampleableMission>(
  seed: number,
  pool: readonly T[],
): T[] {
  const rand = mulberry32(seed)

  const specialRoll = rand()
  const includeSpecial = specialRoll < SPECIAL_PROBABILITY

  const normals = pool.filter((m) => m.type === MissionType.NORMAL)
  const specials = pool.filter((m) => m.type === MissionType.SPECIAL)

  if (includeSpecial && specials.length > 0) {
    const special = seededShuffle(specials, rand)[0]
    const pickedNormals = seededShuffle(normals, rand).slice(0, CANDIDATE_COUNT - 1)
    return [special, ...pickedNormals]
  }

  return seededShuffle(normals, rand).slice(0, CANDIDATE_COUNT)
}
