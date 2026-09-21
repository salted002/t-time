'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_grades', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      exam_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exams', key: 'id' },
        onDelete: 'CASCADE'
      },
      label: { type: Sequelize.STRING, allowNull: false },
      order: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exam_grades');
  }
};
