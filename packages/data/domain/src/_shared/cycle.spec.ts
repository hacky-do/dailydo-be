import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import {
  CANDIDATE_COUNT,
  cycleSeed,
  DailyMissionCycle,
  MissionType,
  resolveCycle,
  SampleableMission,
  sampleCandidates,
} from './cycle'

dayjs.extend(utc)
dayjs.extend(timezone)

/** KST 로컬 시각 문자열을 실제 UTC Date(=resolveCycle now 인자) 로 변환 */
const kstInstant = (s: string): Date => dayjs.tz(s, 'Asia/Seoul').toDate()

describe('cycle: KST cycle 경계 / seed / deterministic 샘플링', () => {
  // ──────────────────────────────────────────────────────────────
  // 정책 1 — KST 05:00~17:00 MORNING, 17:00~익일 05:00 EVENING
  // ──────────────────────────────────────────────────────────────
  describe('정책: KST 05:00~17:00은 MORNING, 17:00~익일05:00은 EVENING이어야 한다', () => {
    it('resolveCycle_kst0459_belongsToPreviousDayEvening', () => {
      const position = resolveCycle(kstInstant('2026-05-22 04:59'))
      expect(position.missionDate).toBe('2026-05-21')
      expect(position.cycle).toBe(DailyMissionCycle.EVENING)
    })

    it('resolveCycle_kst0500_startsTodayMorning', () => {
      const position = resolveCycle(kstInstant('2026-05-22 05:00'))
      expect(position.missionDate).toBe('2026-05-22')
      expect(position.cycle).toBe(DailyMissionCycle.MORNING)
    })

    it('resolveCycle_kst1659_stillMorning', () => {
      const position = resolveCycle(kstInstant('2026-05-22 16:59'))
      expect(position.cycle).toBe(DailyMissionCycle.MORNING)
    })

    it('resolveCycle_kst1700_switchesToEvening', () => {
      const position = resolveCycle(kstInstant('2026-05-22 17:00'))
      expect(position.missionDate).toBe('2026-05-22')
      expect(position.cycle).toBe(DailyMissionCycle.EVENING)
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 2 — 자정 직후(00:00~04:59)는 전날 EVENING, 경계 instant 정확성
  // ──────────────────────────────────────────────────────────────
  describe('정책: 자정 직후(00:30)는 전날 EVENING이고 경계 instant가 정확해야 한다', () => {
    it('resolveCycle_kst0030_isPreviousEveningWithCorrectBoundaries', () => {
      const position = resolveCycle(kstInstant('2026-05-23 00:30'))
      expect(position.missionDate).toBe('2026-05-22')
      expect(position.cycle).toBe(DailyMissionCycle.EVENING)

      // cycleStartedAt = 2026-05-22 17:00 KST = 2026-05-22T08:00:00Z
      expect(position.cycleStartedAt.toISOString()).toBe('2026-05-22T08:00:00.000Z')
      // cycleEndsAt   = 2026-05-23 05:00 KST = 2026-05-22T20:00:00Z
      expect(position.cycleEndsAt.toISOString()).toBe('2026-05-22T20:00:00.000Z')
    })

    it('resolveCycle_serverTzAgnostic_sameResultRegardlessOfHostTz', () => {
      // 같은 UTC instant → 호스트 TZ 무관하게 같은 결과 (backend-spec §1)
      const sameInstant = new Date('2026-05-22T08:00:00.000Z') // = 17:00 KST
      const position = resolveCycle(sameInstant)
      expect(position.cycle).toBe(DailyMissionCycle.EVENING)
      expect(position.missionDate).toBe('2026-05-22')
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 3 — cycleSeed determinism
  // ──────────────────────────────────────────────────────────────
  describe('정책: cycleSeed는 같은 입력에 같은 값, 다른 입력에 다른 값을 내야 한다', () => {
    it('cycleSeed_sameInputs_sameSeed', () => {
      const first = cycleSeed(42, '2026-05-22', DailyMissionCycle.MORNING)
      const second = cycleSeed(42, '2026-05-22', DailyMissionCycle.MORNING)
      expect(first).toBe(second)
    })

    it('cycleSeed_differentCycle_differentSeed', () => {
      const morning = cycleSeed(42, '2026-05-22', DailyMissionCycle.MORNING)
      const evening = cycleSeed(42, '2026-05-22', DailyMissionCycle.EVENING)
      expect(morning).not.toBe(evening)
    })

    it('cycleSeed_guestNullUser_isStableAcrossGuests', () => {
      // 비회원(userId=null) 은 모두 동일 seed (backend-spec §4.5)
      const guestA = cycleSeed(null, '2026-05-22', DailyMissionCycle.MORNING)
      const guestB = cycleSeed(null, '2026-05-22', DailyMissionCycle.MORNING)
      expect(guestA).toBe(guestB)
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 4 — 샘플링 재현성
  // ──────────────────────────────────────────────────────────────
  describe('정책: 같은 seed와 pool이면 후보 10개가 동일하게 재현되어야 한다', () => {
    const normalPool: SampleableMission[] = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      type: MissionType.NORMAL,
    }))

    it('sampleCandidates_sameSeedSamePool_returnsIdenticalCandidates', () => {
      const seed = cycleSeed(42, '2026-05-22', DailyMissionCycle.MORNING)
      const firstDraw = sampleCandidates(seed, normalPool).map((m) => m.id)
      const secondDraw = sampleCandidates(seed, normalPool).map((m) => m.id)
      expect(secondDraw).toEqual(firstDraw)
    })

    it('sampleCandidates_enoughNormals_returnsExactlyTen', () => {
      const seed = cycleSeed(42, '2026-05-22', DailyMissionCycle.MORNING)
      const candidates = sampleCandidates(seed, normalPool)
      expect(candidates).toHaveLength(CANDIDATE_COUNT)
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 5 — special 정책: 포함 시 최대 1개, 나머지는 normal
  // ──────────────────────────────────────────────────────────────
  describe('정책: special은 포함되어도 최대 1개이고 나머지는 normal이어야 한다', () => {
    const mixedPool: SampleableMission[] = [
      ...Array.from({ length: 30 }, (_, i) => ({ id: i + 1, type: MissionType.NORMAL })),
      { id: 901, type: MissionType.SPECIAL },
      { id: 902, type: MissionType.SPECIAL },
    ]

    it('sampleCandidates_anySeed_containsAtMostOneSpecial', () => {
      // SPECIAL_PROBABILITY=0.03 의 분포는 검증하지 않는다 (분포는 §10 단언 X).
      // 정책 자체("최대 1개")만 다양한 seed 에서 위반 없는지 검사.
      for (let seed = 0; seed < 1000; seed++) {
        const candidates = sampleCandidates(seed, mixedPool)
        const specialCount = candidates.filter((m) => m.type === MissionType.SPECIAL).length
        expect(specialCount).toBeLessThanOrEqual(1)
        expect(candidates).toHaveLength(CANDIDATE_COUNT)
      }
    })

    it('sampleCandidates_emptySpecialPool_fallsBackToTenNormals', () => {
      // special 풀이 비면 special 포함 판정과 무관하게 normal 10 (backend-spec §5.1.1)
      const onlyNormals: SampleableMission[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        type: MissionType.NORMAL,
      }))
      const candidates = sampleCandidates(4, onlyNormals)
      expect(candidates.every((m) => m.type === MissionType.NORMAL)).toBe(true)
      expect(candidates).toHaveLength(CANDIDATE_COUNT)
    })
  })
})
