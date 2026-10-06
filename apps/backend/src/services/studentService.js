const { Op } = require('sequelize')
const db = require('../db/models')
const examStatsService = require('./examStatsService')

const VALID_STATUSES = ['재원', '휴원', '퇴원']

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function assertUuid(id, statusCode, message) {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throwError(statusCode, message)
  }
}

function toDetailResponse(student) {
  return {
    id: student.id,
    name: student.name,
    school: student.school,
    grade: student.grade,
    classId: student.classId,
    className: student.Class ? student.Class.name : null,
    status: student.status,
    parentPhone: student.parentPhone,
    enrolledAt: student.enrolledAt,
  }
}

function findGradeLabel(exam, gradeId) {
  if (!gradeId) return null
  const grade = exam.ExamGrades.find((g) => g.id === gradeId)
  return grade ? grade.label : null
}

async function list({ academyId, classId, status, q, limit, offset }) {
  const where = { academyId }

  if (classId) {
    assertUuid(classId, 400, '유효하지 않은 반입니다.')
    where.classId = classId
  }

  if (status) {
    const statuses = status
      .split(',')
      .map((value) => value.trim())
      .filter((value) => VALID_STATUSES.includes(value))
    if (statuses.length > 0) {
      where.status = { [Op.in]: statuses }
    }
  }

  if (q) {
    where.name = { [Op.iLike]: `%${q}%` }
  }

  const { rows, count } = await db.Student.findAndCountAll({
    where,
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
    order: [
      ['enrolledAt', 'DESC'],
      ['name', 'ASC'],
    ],
    limit,
    offset,
  })

  const students = rows.map((student) => ({
    id: student.id,
    name: student.name,
    classId: student.classId,
    className: student.Class ? student.Class.name : null,
    status: student.status,
    school: student.school,
    grade: student.grade,
    parentPhone: student.parentPhone,
    enrolledAt: student.enrolledAt,
  }))

  return { students, count }
}

async function create({
  academyId,
  name,
  classId,
  status,
  school,
  grade,
  parentPhone,
  enrolledAt,
}) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(400, '유효하지 않은 토큰입니다.')
  }

  const resolvedStatus = status || '재원'
  if (!VALID_STATUSES.includes(resolvedStatus)) {
    throwError(400, 'status 값이 올바르지 않습니다.')
  }

  const requiredFields = { name, school, grade, parentPhone }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  if (classId) {
    assertUuid(classId, 400, '유효하지 않은 반입니다.')
    const studentClass = await db.Class.findOne({ where: { id: classId, academyId } })
    if (!studentClass) {
      throwError(400, '유효하지 않은 반입니다.')
    }
  }

  const student = await db.Student.create({
    academyId,
    name,
    classId: classId || null,
    status: resolvedStatus,
    school,
    grade,
    parentPhone,
    enrolledAt: enrolledAt || null,
  })

  return student
}

const BULK_MAX_ROWS = 500;
const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

// 일괄 등록 한 행을 검사해 실패 사유를 반환한다. 통과하면 null
function findBulkRowError(row, classIds) {
  if (!row || typeof row !== 'object') return '행 형식이 올바르지 않습니다.';
  if (!row.name) return '이름은 필수입니다.';
  if (!row.school) return '학교는 필수입니다.';
  if (!row.grade) return '학년은 필수입니다.';
  if (!row.parentPhone) return '학부모연락처는 필수입니다.';
  if (!PHONE_PATTERN.test(row.parentPhone)) return '학부모연락처 형식 오류';
  if (!VALID_STATUSES.includes(row.status)) return '상태 값이 올바르지 않습니다.';
  if (row.classId && !classIds.has(row.classId)) return '유효하지 않은 반입니다.';
  if (row.enrolledAt && (!DATE_PATTERN.test(row.enrolledAt) || Number.isNaN(Date.parse(row.enrolledAt)))) {
    return '등록일자 형식 오류';
  }
  return null;
}

async function bulkCreate({ academyId, rows }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.');
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throwError(400, '등록할 학생이 없습니다.');
  }
  if (rows.length > BULK_MAX_ROWS) {
    throwError(400, `한 번에 최대 ${BULK_MAX_ROWS}명까지 등록할 수 있습니다.`);
  }

  const classes = await db.Class.findAll({ where: { academyId }, attributes: ['id'] });
  const classIds = new Set(classes.map((item) => item.id));

  const validRows = [];
  const failedRows = [];

  rows.forEach((raw, rowIndex) => {
    const row = raw && typeof raw === 'object'
      ? {
        name: toText(raw.name),
        classId: toText(raw.classId) || null,
        status: toText(raw.status) || '재원',
        school: toText(raw.school),
        grade: toText(raw.grade),
        parentPhone: toText(raw.parentPhone),
        enrolledAt: toText(raw.enrolledAt) || null,
      }
      : null;

    const reason = findBulkRowError(row, classIds);
    if (reason) {
      failedRows.push({ rowIndex, reason });
    } else {
      validRows.push({ ...row, academyId });
    }
  });

  if (validRows.length > 0) {
    await db.sequelize.transaction(async (transaction) => {
      await db.Student.bulkCreate(validRows, { transaction });
    });
  }

  return { createdCount: validRows.length, failedRows };
}

async function getById({ academyId, studentId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  assertUuid(studentId, 404, '학생을 찾을 수 없습니다.')

  const student = await db.Student.findOne({
    where: { id: studentId, academyId },
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
  })

  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  return toDetailResponse(student)
}

async function update({
  academyId,
  studentId,
  name,
  classId,
  status,
  school,
  grade,
  parentPhone,
  enrolledAt,
}) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  assertUuid(studentId, 404, '학생을 찾을 수 없습니다.')

  const requiredFields = { name, status, school, grade, parentPhone }

  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  if (!VALID_STATUSES.includes(status)) {
    throwError(400, 'status 값이 올바르지 않습니다.')
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  if (classId) {
    assertUuid(classId, 400, '유효하지 않은 반입니다.')
    const studentClass = await db.Class.findOne({ where: { id: classId, academyId } })
    if (!studentClass) {
      throwError(400, '유효하지 않은 반입니다.')
    }
  }

  await student.update({
    name,
    classId: classId || null,
    status,
    school,
    grade,
    parentPhone,
    enrolledAt: enrolledAt || null,
  })

  const updatedStudent = await db.Student.findOne({
    where: { id: studentId, academyId },
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
  })

  return toDetailResponse(updatedStudent)
}

async function remove({ academyId, studentId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  assertUuid(studentId, 404, '학생을 찾을 수 없습니다.')

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const deleted = { id: student.id, name: student.name }
  await student.destroy()

  return deleted
}

// 학생 상세 성적탭 — 시험 목록 조회 : GET /students/{studentId}/exam-results
async function getExamResults({ academyId, studentId, limit, offset }) {
  assertUuid(studentId, 404, '학생을 찾을 수 없습니다.')

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const { rows, count } = await db.ExamParticipant.findAndCountAll({
    where: { studentId },
    include: [
      {
        model: db.Exam,
        required: true,
        include: [
          { model: db.Class, attributes: ['id', 'name'], required: false },
          { model: db.ExamSubject, separate: true },
        ],
      },
    ],
    order: [
      [db.Exam, 'examDate', 'DESC'],
      [db.Exam, 'createdAt', 'DESC'],
    ],
    limit,
    offset,
  })

  const examResults = rows.map((participant) => ({
    examId: participant.Exam.id,
    examDate: participant.Exam.examDate,
    className: participant.Exam.Class ? participant.Exam.Class.name : null,
    examName: participant.Exam.name,
    subjectCount: participant.Exam.ExamSubjects.length,
    evalType: participant.Exam.evalType,
    memo: participant.Exam.memo,
  }))

  return { examResults, count }
}

// 학생 상세 성적탭 — 시험 상세 조회 : GET /students/{studentId}/exam-results/{examId}
async function getExamResultDetail({ academyId, studentId, examId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  assertUuid(studentId, 404, '학생을 찾을 수 없습니다.')
  assertUuid(examId, 404, '응시 기록을 찾을 수 없습니다.')

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const targetParticipant = await db.ExamParticipant.findOne({
    where: { studentId, examId },
    include: [
      {
        model: db.Exam,
        where: { academyId },
        include: [
          { model: db.Class, attributes: ['id', 'name'], required: false },
          { model: db.ExamSubject },
          { model: db.ExamGrade },
        ],
      },
      { model: db.ExamScore },
    ],
  })

  if (!targetParticipant) {
    throwError(404, '응시 기록을 찾을 수 없습니다.')
  }

  const exam = targetParticipant.Exam
  const isGradeExam = exam.evalType === 'grade'

  const allParticipants = await db.ExamParticipant.findAll({
    where: { examId },
    include: [{ model: db.ExamScore }],
  })

  // participant별로 "과목id → ExamScore" 맵을 만들어 examStatsService에 넘길 형태로 변환
  const withScoresBySubject = allParticipants.map((participant) => ({
    participantId: participant.id,
    scoresBySubject: new Map(participant.ExamScores.map((score) => [score.subjectId, score])),
  }))

  const { ranked, classAverageTotal } = examStatsService.computeTotals({
    isGradeExam,
    examSubjects: exam.ExamSubjects,
    participants: withScoresBySubject,
  })

  let myTotalRank = null
  let myTotal = null

  if (!isGradeExam) {
    const mine = ranked.find((p) => p.participantId === targetParticipant.id)
    myTotalRank = mine ? mine.rank : null // 통계 제외 대상이면 석차 없음
    myTotal = mine ? mine.total : null
  }

  const subjectStats = isGradeExam
    ? new Map()
    : examStatsService.computeSubjectStats({
        examSubjects: exam.ExamSubjects,
        participants: withScoresBySubject,
      })

  const myScoresBySubject = new Map(
    targetParticipant.ExamScores.map((score) => [score.subjectId, score]),
  )

  const results = exam.ExamSubjects.map((subject) => {
    const myScore = myScoresBySubject.get(subject.id)
    const stats = subjectStats.get(subject.id)
    const myRankEntry = stats
      ? stats.ranks.find((rank) => rank.participantId === targetParticipant.id)
      : null

    return {
      subjectId: subject.id,
      score: isGradeExam ? null : myScore ? myScore.score : null,
      gradeLabel: isGradeExam ? findGradeLabel(exam, myScore ? myScore.gradeId : null) : null,
      classAverage: stats ? stats.average : null,
      subjectRank: myRankEntry ? myRankEntry.rank : null,
    }
  })

  const maxScoreTotal =
    exam.evalType === 'score_max'
      ? exam.ExamSubjects.reduce(
          (sum, subject) => sum + (subject.maxScore ? Number(subject.maxScore) : 0),
          0,
        )
      : null

  let subjectComparison = null
  let recentTrend = null

  if (!isGradeExam) {
    subjectComparison = exam.ExamSubjects.map((subject) => {
      const myScore = myScoresBySubject.get(subject.id)
      const stats = subjectStats.get(subject.id)
      return {
        subjectId: subject.id,
        personalScore: myScore ? myScore.score : null,
        examAverage: stats ? stats.average : null,
      }
    })

    const subjectNames = exam.ExamSubjects.map((subject) => subject.name)
    const trendBySubjectName = await examStatsService.getRecentTrendByStudent({
      academyId,
      studentId,
      subjectNames,
      limit: 6,
    })

    recentTrend = exam.ExamSubjects.map((subject) => ({
      subjectId: subject.id,
      history: trendBySubjectName.get(subject.name) || [],
    }))
  }

  return {
    examInfo: {
      examDate: exam.examDate,
      className: exam.Class ? exam.Class.name : null,
      examName: exam.name,
      evalType: exam.evalType,
      memo: exam.memo,
      subjectCount: exam.ExamSubjects.length,
      grades: exam.ExamGrades.map((grade) => ({
        id: grade.id,
        label: grade.label,
        order: grade.order,
      })),
    },
    participantId: targetParticipant.id,
    subjects: exam.ExamSubjects.map((subject) => ({
      subjectId: subject.id,
      name: subject.name,
      maxScore: subject.maxScore,
    })),
    results,
    total: {
      score: myTotal,
      maxScoreTotal,
      classAverage: classAverageTotal,
      rank: myTotalRank,
    },
    teacherComment: targetParticipant.teacherComment,
    subjectComparison,
    recentTrend,
    gradeDistribution: isGradeExam
      ? examStatsService.computeGradeDistribution({
          examSubjects: exam.ExamSubjects,
          examGrades: exam.ExamGrades,
          participants: withScoresBySubject,
        })
      : null,
  }
}

module.exports = { list, create, bulkCreate, getById, update, remove, getExamResults, getExamResultDetail }
