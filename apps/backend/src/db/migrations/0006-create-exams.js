'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exams', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      academy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'academies', key: 'id' },
        onDelete: 'CASCADE'
      },
      class_id: {
        type: Sequelize.UUID,
        allowNull: true, // SET NULL을 쓰려면 NULL 허용 필요
        references: { model: 'classes', key: 'id' },
        onDelete: 'SET NULL' // 반 삭제해도 시험/성적 기록은 보존, class_id만 NULL 처리
      },
      exam_date: { type: Sequelize.DATEONLY, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      eval_type: { type: Sequelize.ENUM('score', 'score_max', 'grade'), allowNull: false },
      memo: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exams');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_exams_eval_type";');
  }
};
