const { Op } = require('sequelize')
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

  let sum = 0
  let hasScore = false
  examSubjects.forEach((subject) => {
    const score = scoresBySubject.get(subject.id)
    if (score && score.score !== null) {
      sum += Number(score.score)
      hasScore = true
    }
  })

  return hasScore ? sum : null // 하나도 입력 안 했으면 0이 아니라 null
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

  const entered = withTotals.filter((p) => p.total !== null)
  const notEntered = withTotals.filter((p) => p.total === null)

  const rankedEntered = assignRanks(entered, (p) => p.total)
  const ranked = [...rankedEntered, ...notEntered.map((p) => ({ ...p, rank: null }))]

  const classAverageTotal = entered.length
    ? Number((entered.reduce((sum, p) => sum + p.total, 0) / entered.length).toFixed(1))
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
 * 등급형: 과목별 등급 인원 분포 계산 (인원이 0인 등급도 포함)
 */
function computeGradeDistribution({ examSubjects, examGrades, participants }) {
  const grades = [...examGrades].sort((a, b) => a.order - b.order)

  return examSubjects.map((subject) => {
    const countByGrade = new Map(grades.map((g) => [g.id, 0]))
    participants.forEach((p) => {
      const score = p.scoresBySubject.get(subject.id)
      if (score && score.gradeId && countByGrade.has(score.gradeId)) {
        countByGrade.set(score.gradeId, countByGrade.get(score.gradeId) + 1)
      }
    })
    return {
      subjectId: subject.id,
      distribution: grades.map((g) => ({
        gradeId: g.id,
        label: g.label,
        count: countByGrade.get(g.id),
      })),
    }
  })
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
      {
        model: db.Exam,
        where: { academyId },
        include: [{ model: db.ExamSubject, separate: true }],
      },
      { model: db.ExamScore, separate: true },
    ],
    order: [
      [db.Exam, 'examDate', 'DESC'],
      [db.Exam, 'createdAt', 'DESC'],
    ],
    limit,
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

/**
 * 여러 시험(examIds)의 "과목명별 반평균"을 한 번에 계산한다.
 * 리포트의 "같은 반 평균 대비 10회 추이"처럼, 과거 여러 시험 각각의 반평균이 필요할 때 쓴다.
 * 반환값: Map<examId, Map<subjectName, average>>
 */
async function getClassAveragesBySubjectName({ examIds }) {
  if (examIds.length === 0) return new Map()

  const participants = await db.ExamParticipant.findAll({
    where: { examId: examIds },
    include: [
      { model: db.Student, attributes: ['id', 'status'], required: false },
      { model: db.ExamScore },
      { model: db.Exam, attributes: ['id'], include: [{ model: db.ExamSubject }] },
    ],
  })

  const participantsByExam = new Map(examIds.map((id) => [id, []]))
  participants.forEach((participant) => {
    participantsByExam.get(participant.examId).push(participant)
  })

  const result = new Map()
  examIds.forEach((examId) => {
    const examParticipants = participantsByExam.get(examId)
    const exam = examParticipants[0] ? examParticipants[0].Exam : null
    const averagesBySubjectName = new Map()

    if (exam) {
      exam.ExamSubjects.forEach((subject) => {
        const values = examParticipants
          .map((participant) =>
            participant.ExamScores.find((score) => score.subjectId === subject.id),
          )
          .filter((score) => score && score.score !== null)
          .map((score) => Number(score.score))

        averagesBySubjectName.set(
          subject.name,
          values.length
            ? Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1))
            : null,
        )
      })
    }

    result.set(examId, averagesBySubjectName)
  })

  return result
}

/**
 * 같은 반의 최근 N회 시험 반평균 동향.
 * 반환값: Map<과목명, [{ examId, examDate, classAverage}]> (오래된 → 최신)
 */
async function getClassAverageTrend({ academyId, classId, examDate, limit }) {
  if (!classId) return new Map()

  const recentExams = await db.Exam.findAll({
    where: {
      academyId,
      classId,
      evalType: { [Op.ne]: 'grade' },
      examDate: { [Op.lte]: examDate },
    },
    order: [
      ['examDate', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit, // include가 없어서 limit이 정확히 걸림
  })

  const chronological = [...recentExams].reverse()
  const averagesByExam = await getClassAveragesBySubjectName({
    examIds: chronological.map((e) => e.id),
  })

  const trendBySubjectName = new Map()
  chronological.forEach((exam) => {
    const averages = averagesByExam.get(exam.id) || new Map()
    averages.forEach((average, subjectName) => {
      if (!trendBySubjectName.has(subjectName)) trendBySubjectName.set(subjectName, [])
      trendBySubjectName.get(subjectName).push({
        examId: exam.id,
        examDate: exam.examDate,
        classAverage: average,
      })
    })
  })
  return trendBySubjectName
}

/**
 * 학생이 최근 N회 시험에서 "실제로 응시한 과목명" 전체를 가져온다.
 * 일괄 리포트 흐름에서 "선택한 과목 중 이 학생이 최근 10회 내 응시한 과목만" 걸러낼 때 쓴다.
 * 반환값: Set<subjectName>
 */
async function getRecentExamSubjectNames({ academyId, studentId, limit }) {
  const recentParticipants = await db.ExamParticipant.findAll({
    where: { studentId },
    include: [
      {
        model: db.Exam,
        where: { academyId },
        include: [{ model: db.ExamSubject, separate: true }],
      },
    ],
    order: [
      [db.Exam, 'examDate', 'DESC'],
      [db.Exam, 'createdAt', 'DESC'],
    ],
    limit,
  })

  const subjectNames = new Set()
  recentParticipants.forEach((participant) => {
    participant.Exam.ExamSubjects.forEach((subject) => subjectNames.add(subject.name))
  })

  return subjectNames
}

module.exports = {
  assignRanks,
  computeTotal,
  computeTotals,
  computeSubjectStats,
  computeGradeDistribution,
  getRecentTrendByStudent,
  getClassAveragesBySubjectName,
  getClassAverageTrend,
  getRecentExamSubjectNames,
}
