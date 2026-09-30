'use strict'

// academies.is_demo 추가 (2026-09-30)
// 데모 계정 판별용 — SMS 실제 발송 생략(36번), 슬러그 변경/학원 삭제/비밀번호 변경 제한(403, 50·51·52번)에 사용

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('academies', 'is_demo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('academies', 'is_demo')
  },
}
