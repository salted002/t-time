'use strict'

// reports.subject_stats 추가 (2026-09-30)
// 리포트 상세(31번)를 "조회 시점 재계산"에서 "저장 시점 스냅샷"으로 변경하기로 하면서 필요해진 컬럼.
// 점수/반평균 수치를 저장 시점 그대로 얼려두고, 이후 성적이 수정돼도 이미 저장된 리포트엔 반영하지 않는다.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('reports', 'subject_stats', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}, // 기존 행(과거 데이터)이 있을 경우 NOT NULL 제약을 만족시키기 위한 임시값
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('reports', 'subject_stats')
  },
}
