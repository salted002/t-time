const db = require('../db/models')

/**
 * 배열 항목에 "공동순위"를 부여한다.
 * - 동점자는 같은 순위를 받고, 다음 순위는 동점자 수만큼 건너뛴다. (공동 1등 2명 → 다음은 3등)
 * - items 원본은 건드리지 않고, { ...item, rank: 'n/전체' } 필드가 추가된 새 배열을 반환한다.
 * - getValue: 각 item에서 "순위를 매길 값"을 꺼내는 함수. (총점일 수도, 과목 점수일 수도 있어서 콜백으로 뺐다)
 */
function assignRanks(items, getValue) {
  const sorted = [...items].sort((a, b) => getValue(b) - getValue(a))
  let currentRank = 0
  let previousValue = null

  return sorted.map((item, index) => {
    const value = getValue(item)
    if (value !== previousValue) {
      currentRank = index + 1
      previousValue = value
    }
    return { ...item, rank: `${currentRank}/${sorted.length}` }
  })
}

/**
 * 응시자 한 명의 과목별 점수를 합산해 총점을 계산한다. (등급형이면 null)
 * scoresBySubject: Map<subjectId, ExamScore 인스턴스>
 */
function computeTotal({ isGradeExam, examSubjects, scoresBySubject }) {
  if (isGradeExam) return null

  return examSubjects.reduce((sum, subject) => {
    const score = scoresBySubject.get(subject.id)
    return score && score.score !== null ? sum + Number(score.score) : sum
  }, 0)
}

/**
 * "활성 응시자 전체"의 총점 · 총점석차(공동순위) · 반총점평균을 한 번에 계산한다.
 * participants: [{ participantId, scoresBySubject: Map<subjectId, ExamScore>, ...나머지 필드는 그대로 유지 }]
 * 반환값:
 *  - ranked: 각 참가자 객체에 total과 rank(문자열, 등급형이면 없음)가 채워진 배열
 *  - classAverageTotal: 반 전체 총점 평균 (등급형이면 null)
 */
function computeTotals({ isGradeExam, examSubjects, participants }) {
  const withTotals = participants.map((p) => ({
    ...p,
    total: computeTotal({ isGradeExam, examSubjects, scoresBySubject: p.scoresBySubject }),
  }))

  if (isGradeExam) {
    return { ranked: withTotals, classAverageTotal: null }
  }

  const ranked = assignRanks(withTotals, (p) => p.total)

  const classAverageTotal = ranked.length
    ? Number((ranked.reduce((sum, p) => sum + (p.total || 0), 0) / ranked.length).toFixed(1))
    : null

  return { ranked, classAverageTotal }
}

/**
 * 과목별 반평균 + 과목석차(공동순위)를 계산한다.
 * 반환값: Map<subjectId, { average, ranks: [{ participantId, score, rank }] }>
 * (등급형 시험은 애초에 호출하는 쪽에서 이 함수를 부르지 않는다 — 점수형 전용)
 */
function computeSubjectStats({ examSubjects, participants }) {
  const subjectStats = new Map()

  examSubjects.forEach((subject) => {
    const values = participants
      .map((p) => {
        const score = p.scoresBySubject.get(subject.id)
        return score && score.score !== null
          ? { participantId: p.participantId, score: Number(score.score) }
          : null
      })
      .filter(Boolean)

    const ranks = assignRanks(values, (v) => v.score)

    const average = values.length
      ? Number((values.reduce((sum, v) => sum + v.score, 0) / values.length).toFixed(1))
      : null

    subjectStats.set(subject.id, { average, ranks })
  })

  return subjectStats
}

/**
 * 학생 한 명의 "최근 N회 시험" 점수 동향을 과목명 기준으로 가져온다.
 * subjectId는 시험마다 새로 생성되므로, 같은 과목인지는 "이름"으로 판단한다.
 * subjectNames: 동향을 보고 싶은 과목명 배열 (예: ['문법', 'Reading'])
 * 반환값: Map<subjectName, [{ examId, examDate, score }]>  (오래된 → 최신 순)
 */
async function getRecentTrendByStudent({ academyId, studentId, subjectNames, limit }) {
  const recentParticipants = await db.ExamParticipant.findAll({
    where: { studentId },
    include: [
      { model: db.Exam, where: { academyId }, include: [{ model: db.ExamSubject }] },
      { model: db.ExamScore, separate: true },
    ],
    order: [[db.Exam, 'examDate', 'DESC']],
    limit,
    subQuery: false,
  })

  const chronological = [...recentParticipants].reverse()

  const trendBySubjectName = new Map()

  subjectNames.forEach((subjectName) => {
    const history = chronological
      .map((participant) => {
        const matchedSubject = participant.Exam.ExamSubjects.find((s) => s.name === subjectName)
        if (!matchedSubject) return null

        const score = participant.ExamScores.find((s) => s.subjectId === matchedSubject.id)
        return {
          examId: participant.Exam.id,
          examDate: participant.Exam.examDate,
          score: score ? score.score : null,
        }
      })
      .filter(Boolean)

    trendBySubjectName.set(subjectName, history)
  })

  return trendBySubjectName
}

module.exports = {
  assignRanks,
  computeTotal,
  computeTotals,
  computeSubjectStats,
  getRecentTrendByStudent,
}
