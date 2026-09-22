'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('academies', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false },
      business_number: { type: Sequelize.STRING, allowNull: false },
      owner_name: { type: Sequelize.STRING, allowNull: false },
      logo_url: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: true },
      sms_sender_number: { type: Sequelize.STRING, allowNull: true },
      subscription_status: {
        type: Sequelize.ENUM('FREE', 'SUBSCRIBED'),
        allowNull: false,
        defaultValue: 'FREE',
      },
      subscribed_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    })

    // 소프트 삭제(deleted_at IS NULL) 상태의 학원들만 UNIQUE 검증하도록 부분 유니크 인덱스 생성
    await queryInterface.addIndex('academies', ['slug'], {
      unique: true,
      name: 'academies_slug_partial_unique',
      where: { deleted_at: null },
    })

    await queryInterface.addIndex('academies', ['business_number'], {
      unique: true,
      name: 'academies_business_number_partial_unique',
      where: { deleted_at: null },
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('academies')
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_academies_subscription_status";',
    )
  },
}
