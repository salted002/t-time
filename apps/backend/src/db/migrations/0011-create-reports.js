'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      academy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'academies', key: 'id' },
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE'
      },
      exam_ids: { type: Sequelize.JSON, allowNull: false }, // 최근 10회 기준 시험 ID 목록
      subject_names: { type: Sequelize.JSON, allowNull: false }, // 리포트 목록 과목수 계산용
      ai_feedback: { type: Sequelize.TEXT, allowNull: true }, // 저장 시점 스냅샷
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reports');
  }
};
