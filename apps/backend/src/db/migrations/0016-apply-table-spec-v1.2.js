'use strict'

// 테이블정의서 v1.2 반영 (2026-09-26)
// 1) reports.teacher_feedback 추가 (JSON)
// 2) reports.ai_feedback TEXT → JSON
// 3) exam_scores (participant_id, subject_id) UNIQUE
// 4) student_counselings.target ENUM 값 '보호자' → '학부모'
// 5) users.deleted_at 추가 + email 부분 유니크 (deleted_at IS NULL 기준)

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1) 선생님 피드백 {과목명: 피드백}
      await queryInterface.addColumn(
        'reports',
        'teacher_feedback',
        { type: Sequelize.JSON, allowNull: true },
        { transaction },
      )

      // 2) TEXT → JSON 은 PostgreSQL이 자동 변환을 못 해서 USING으로 변환 방법을 지정
      await queryInterface.sequelize.query(
        'ALTER TABLE reports ALTER COLUMN ai_feedback TYPE JSON USING ai_feedback::json;',
        { transaction },
      )

      // 3) 한 응시자가 같은 과목 점수를 두 번 갖지 않도록
      await queryInterface.addIndex('exam_scores', ['participant_id', 'subject_id'], {
        unique: true,
        name: 'exam_scores_participant_subject_unique',
        transaction,
      })

      // 4) ENUM 값 이름 변경 — 기존에 '보호자'로 저장된 행도 자동으로 '학부모'가 됨
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_student_counselings_target" RENAME VALUE '보호자' TO '학부모';`,
        { transaction },
      )

      // 5) users 소프트 삭제 표시 + 이메일 부분 유니크
      await queryInterface.addColumn(
        'users',
        'deleted_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      )
      // 0002에서 email에 걸었던 전체 UNIQUE 제거 (PostgreSQL 기본 이름: 테이블_컬럼_key)
      await queryInterface.removeConstraint('users', 'users_email_key', { transaction })
      await queryInterface.addIndex('users', ['email'], {
        unique: true,
        name: 'users_email_partial_unique',
        where: { deleted_at: null },
        transaction,
      })
    })
  },

  async down(queryInterface, Sequelize) {
    // up의 역순으로 되돌림
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('users', 'users_email_partial_unique', { transaction })
      await queryInterface.addConstraint('users', {
        fields: ['email'],
        type: 'unique',
        name: 'users_email_key',
        transaction,
      })
      await queryInterface.removeColumn('users', 'deleted_at', { transaction })

      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_student_counselings_target" RENAME VALUE '학부모' TO '보호자';`,
        { transaction },
      )

      await queryInterface.removeIndex('exam_scores', 'exam_scores_participant_subject_unique', {
        transaction,
      })

      await queryInterface.sequelize.query(
        'ALTER TABLE reports ALTER COLUMN ai_feedback TYPE TEXT USING ai_feedback::text;',
        { transaction },
      )
      await queryInterface.removeColumn('reports', 'teacher_feedback', { transaction })
    })
  },
}
