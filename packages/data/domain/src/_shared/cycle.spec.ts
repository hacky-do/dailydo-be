import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import {
  CANDIDATE_COUNT,
  dailySeed,
  getMissionDate,
  MissionType,
  SampleableMission,
  sampleCandidates,
} from './cycle'

dayjs.extend(utc)
dayjs.extend(timezone)

/** KST 로컬 시각 문자열을 실제 UTC Date(=함수 now 인자) 로 변환 */
const kstInstant = (s: string): Date => dayjs.tz(s, 'Asia/Seoul').toDate()

describe('cycle (v2 — 하루 1번 모델): KST 자정 경계 / seed / deterministic 샘플링', () => {
  // ──────────────────────────────────────────────────────────────
  // 정책 1 — KST 자정 경계 (하루 1번)
  // ──────────────────────────────────────────────────────────────
  describe('정책: missionDate 는 KST 자정 기준으로 결정된다', () => {
    it('getMissionDate_kst0000_isTheNewDay', () => {
      expect(getMissionDate(kstInstant('2026-05-22 00:00'))).toBe('2026-05-22')
    })

    it('getMissionDate_kst2359_isStillSameDay', () => {
      expect(getMissionDate(kstInstant('2026-05-22 23:59'))).toBe('2026-05-22')
    })

    it('getMissionDate_kst0001_nextDay', () => {
      expect(getMissionDate(kstInstant('2026-05-23 00:01'))).toBe('2026-05-23')
    })

    it('getMissionDate_serverTzAgnostic_sameResultRegardlessOfHostTz', () => {
      // 같은 UTC instant → 호스트 TZ 무관하게 같은 결과
      // 2026-05-22T15:00:00.000Z = 2026-05-23 00:00 KST
      expect(getMissionDate(new Date('2026-05-22T15:00:00.000Z'))).toBe('2026-05-23')
    })

    it('getMissionDate_kstJustBeforeMidnight_staysSameDay', () => {
      // 2026-05-22T14:59:59.999Z = 2026-05-22 23:59:59 KST (전날)
      expect(getMissionDate(new Date('2026-05-22T14:59:59.999Z'))).toBe('2026-05-22')
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 2 — dailySeed determinism
  // ──────────────────────────────────────────────────────────────
  describe('정책: dailySeed 는 같은 입력에 같은 값, 다른 입력에 다른 값을 내야 한다', () => {
    it('dailySeed_sameInputs_sameSeed', () => {
      expect(dailySeed(42, '2026-05-22')).toBe(dailySeed(42, '2026-05-22'))
    })

    it('dailySeed_differentDate_differentSeed', () => {
      expect(dailySeed(42, '2026-05-22')).not.toBe(dailySeed(42, '2026-05-23'))
    })

    it('dailySeed_differentUser_differentSeed', () => {
      expect(dailySeed(1, '2026-05-22')).not.toBe(dailySeed(2, '2026-05-22'))
    })

    it('dailySeed_guestNullUser_isStableAcrossGuests', () => {
      // 비회원(userId=null) 은 모두 동일 seed
      expect(dailySeed(null, '2026-05-22')).toBe(dailySeed(null, '2026-05-22'))
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 3 — 샘플링 재현성
  // ──────────────────────────────────────────────────────────────
  describe('정책: 같은 seed와 pool이면 후보 10개가 동일하게 재현되어야 한다', () => {
    const normalPool: SampleableMission[] = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      type: MissionType.NORMAL,
    }))

    it('sampleCandidates_sameSeedSamePool_returnsIdenticalCandidates', () => {
      const seed = dailySeed(42, '2026-05-22')
      const firstDraw = sampleCandidates(seed, normalPool).map((m) => m.id)
      const secondDraw = sampleCandidates(seed, normalPool).map((m) => m.id)
      expect(secondDraw).toEqual(firstDraw)
    })

    it('sampleCandidates_enoughNormals_returnsExactlyTen', () => {
      const seed = dailySeed(42, '2026-05-22')
      const candidates = sampleCandidates(seed, normalPool)
      expect(candidates).toHaveLength(CANDIDATE_COUNT)
    })
  })

  // ──────────────────────────────────────────────────────────────
  // 정책 4 — special 정책: 최대 1개, 나머지 normal
  // ──────────────────────────────────────────────────────────────
  describe('정책: special은 포함되어도 최대 1개이고 나머지는 normal이어야 한다', () => {
    const mixedPool: SampleableMission[] = [
      ...Array.from({ length: 30 }, (_, i) => ({ id: i + 1, type: MissionType.NORMAL })),
      { id: 901, type: MissionType.SPECIAL },
      { id: 902, type: MissionType.SPECIAL },
    ]

    it('sampleCandidates_anySeed_containsAtMostOneSpecial', () => {
      // 1000 seed 반복 — 정책("최대 1개") 위반 없는지
      for (let seed = 0; seed < 1000; seed++) {
        const candidates = sampleCandidates(seed, mixedPool)
        const specialCount = candidates.filter((m) => m.type === MissionType.SPECIAL).length
        expect(specialCount).toBeLessThanOrEqual(1)
        expect(candidates).toHaveLength(CANDIDATE_COUNT)
      }
    })

    it('sampleCandidates_emptySpecialPool_fallsBackToTenNormals', () => {
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
