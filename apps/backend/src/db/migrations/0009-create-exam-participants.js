'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_participants', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      exam_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exams', key: 'id' },
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'students', key: 'id' },
        onDelete: 'SET NULL' // 학생 레코드가 삭제돼도 통계 정합성을 유지하기 위한 SET NULL
      },
      student_name_snapshot: { type: Sequelize.STRING, allowNull: false }, // 응시 당시 이름 스냅샷 보존
      teacher_comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exam_participants');
  }
};
