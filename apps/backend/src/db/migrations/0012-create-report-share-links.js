'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('report_share_links', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      report_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'reports', key: 'id' },
        onDelete: 'CASCADE'
      },
      token: { type: Sequelize.STRING, allowNull: false, unique: true }, // 유추 불가능한 난수 토큰
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('report_share_links');
  }
};
