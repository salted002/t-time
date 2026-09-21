'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      academy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'academies', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      class_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'classes', key: 'id' },
        onDelete: 'SET NULL', // 반 삭제 시 학생 정보 보존을 위한 SET NULL 처리
      },
      status: {
        type: Sequelize.ENUM('재원', '휴원', '퇴원'),
        allowNull: false,
        defaultValue: '재원',
      },
      school: { type: Sequelize.STRING, allowNull: false },
      grade: { type: Sequelize.STRING, allowNull: false },
      parent_phone: { type: Sequelize.STRING, allowNull: false },
      enrolled_at: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('students')
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_students_status";',
    )
  },
}
