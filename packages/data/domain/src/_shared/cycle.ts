import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export enum DailyMissionCycle {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
}

export enum MissionType {
  NORMAL = 'NORMAL',
  SPECIAL = 'SPECIAL',
}

export enum DailyMissionStatus {
  ARRIVED = 'ARRIVED',
  CONFIRMED = 'CONFIRMED',
}

// ────────────────────────────────────────────────────────────────────────────
// 선택/제한 상수
// ────────────────────────────────────────────────────────────────────────────
export const MIN_SELECTABLE = 1
export const MAX_SELECTABLE = 3
export const CANDIDATE_COUNT = 10
export const SPECIAL_PROBABILITY = 0.03
export const MEMO_MAX_LENGTH = 200
export const MYLOG_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const MYLOG_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

// ────────────────────────────────────────────────────────────────────────────
// (2) cycle 유틸 — INDEX §3.3(2) 정본 / backend-spec §3.2
// ────────────────────────────────────────────────────────────────────────────
const KST = 'Asia/Seoul'
const MORNING_HOUR = 5
const EVENING_HOUR = 17

export interface CyclePosition {
  /** 'YYYY-MM-DD' (KST 기준) */
  missionDate: string
  cycle: DailyMissionCycle
  /** UTC instant of KST 05:00 or 17:00 */
  cycleStartedAt: Date
  /** next cycle start (UTC instant) */
  cycleEndsAt: Date
}

/**
 * 현재 시각을 받아 어느 cycle 에 속하는지 + 경계 instant 를 계산.
 * - KST 05:00 ≤ t < 17:00 → 오늘 MORNING
 * - KST 17:00 ≤ t < 익일 05:00 → 오늘 EVENING
 * - KST 00:00 ~ 04:59 → 전날 missionDate 의 EVENING
 *
 * 서버 로컬 TZ 무관 (dayjs 명시 변환). DST 없음 가정 (KST 고정 +09:00).
 */
export function resolveCycle(now: Date): CyclePosition {
  const kst = dayjs(now).tz(KST)
  const hour = kst.hour()
  const todayKst = kst.startOf('day')

  if (hour >= MORNING_HOUR && hour < EVENING_HOUR) {
    // 05:00 ~ 17:00 → 오늘 MORNING
    const start = todayKst.hour(MORNING_HOUR)
    const end = todayKst.hour(EVENING_HOUR)

    return {
      missionDate: todayKst.format('YYYY-MM-DD'),
      cycle: DailyMissionCycle.MORNING,
      cycleStartedAt: start.utc().toDate(),
      cycleEndsAt: end.utc().toDate(),
    }
  }

  if (hour >= EVENING_HOUR) {
    // 17:00 ~ 익일 05:00 (오늘 날짜 부분) → 오늘 EVENING
    const start = todayKst.hour(EVENING_HOUR)
    const end = todayKst.add(1, 'day').hour(MORNING_HOUR)

    return {
      missionDate: todayKst.format('YYYY-MM-DD'),
      cycle: DailyMissionCycle.EVENING,
      cycleStartedAt: start.utc().toDate(),
      cycleEndsAt: end.utc().toDate(),
    }
  }

  // 00:00 ~ 04:59 → 전날 missionDate 의 EVENING
  const yesterdayKst = todayKst.subtract(1, 'day')
  const start = yesterdayKst.hour(EVENING_HOUR)
  const end = todayKst.hour(MORNING_HOUR)

  return {
    missionDate: yesterdayKst.format('YYYY-MM-DD'),
    cycle: DailyMissionCycle.EVENING,
    cycleStartedAt: start.utc().toDate(),
    cycleEndsAt: end.utc().toDate(),
  }
}

/**
 * deterministic 샘플링 seed.
 * - 회원: (userId, missionDate, cycle) 조합 — 사용자마다 다른 후보
 * - 비회원(userId=null): 모든 비회원 동일 후보
 */
export function cycleSeed(
  userId: number | null,
  missionDate: string,
  cycle: DailyMissionCycle,
): number {
  const key = `${userId ?? 'guest'}|${missionDate}|${cycle}`

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

/**
 * 샘플링 입력의 최소 구조 타입. ch2 `Mission` 엔티티와 순환 의존을 피한다.
 * 실제 호출부는 `Mission[]` 을 그대로 넘기면 된다(super-type).
 */
export interface SampleableMission {
  id: number
  type: MissionType
}

/**
 * mulberry32 — seed 하나로 결정적 의사난수 스트림 생성.
 * 같은 seed → 같은 draw 시퀀스 (재현성).
 */
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

/** Fisher-Yates — 입력 배열 불변, 새 배열 반환. 결정적(rand 가 결정적이면). */
function seededShuffle<T>(items: readonly T[], rand: () => number): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 활성 미션 풀에서 deterministic 하게 후보 CANDIDATE_COUNT(10) 개 선택.
 *
 * - 같은 (seed, pool) → 항상 같은 결과 (무저장 재현, backend-spec §5.1)
 * - special 3% 판정: seed 스트림 첫 draw 로 결정. 포함 시 normal 9 + special 1.
 *   미포함 또는 special pool 비면 normal 10 (backend-spec §5.1.1).
 * - special 은 결과에 **최대 1개**.
 *
 * 트레이드오프: 어드민이 cycle 중간에 pool 을 바꾸면 seed 가 같아도 입력 pool 이
 * 달라져 후보가 변할 수 있다(허용, backend-spec §5.1 완화안 B).
 */
export function sampleCandidates<T extends SampleableMission>(
  seed: number,
  pool: readonly T[],
): T[] {
  const rand = mulberry32(seed)

  // 1) special 포함 여부 — 셔플보다 먼저 소비해 normal 셔플 결과와 독립시킨다
  const specialRoll = rand()
  const includeSpecial = specialRoll < SPECIAL_PROBABILITY

  const normals = pool.filter((m) => m.type === MissionType.NORMAL)
  const specials = pool.filter((m) => m.type === MissionType.SPECIAL)

  // 2) special 포함 + pool 존재 → normal 9 + special 1
  if (includeSpecial && specials.length > 0) {
    const special = seededShuffle(specials, rand)[0]
    const pickedNormals = seededShuffle(normals, rand).slice(0, CANDIDATE_COUNT - 1)
    return [special, ...pickedNormals]
  }

  // 3) 미포함 / special pool 비었음 → normal 10 (또는 pool 부족 시 가능한 만큼)
  return seededShuffle(normals, rand).slice(0, CANDIDATE_COUNT)
}
