'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('platform_admins', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('platform_admins')
  },
}
