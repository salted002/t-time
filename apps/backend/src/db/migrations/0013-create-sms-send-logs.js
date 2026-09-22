'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sms_send_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      academy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'academies', key: 'id' },
        onDelete: 'CASCADE'
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'students', key: 'id' },
        onDelete: 'SET NULL'
      },
      student_name_snapshot: { type: Sequelize.STRING, allowNull: false }, // 발송 시점 이름 스냅샷
      recipient_phone: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      report_share_link_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'report_share_links', key: 'id' },
        onDelete: 'SET NULL' // 이력 상세 화면에서 리포트로 이동하기 위한 참조
      },
      sent_at: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.ENUM('성공', '실패'), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sms_send_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sms_send_logs_status";');
  }
};
