'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('student_counselings', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE'
      },
      counseling_date: { type: Sequelize.DATEONLY, allowNull: false },
      target: { type: Sequelize.ENUM('학생', '보호자'), allowNull: false },
      counselor_name: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('student_counselings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_student_counselings_target";');
  }
};
