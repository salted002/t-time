'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_subjects', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      exam_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exams', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: false },
      max_score: { type: Sequelize.DECIMAL(5, 1), allowNull: true }, // 소수 첫째자리 SR 시험 대응
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exam_subjects');
  }
};
