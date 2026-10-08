'use strict'

module.exports = {
  async up(queryInterface) {
    const strip = (table, col) =>
      queryInterface.sequelize.query(
        `UPDATE ${table} SET ${col} = regexp_replace(${col}, '[^0-9]', '', 'g') WHERE ${col} ~ '[^0-9]'`,
      )
    await strip('students', 'parent_phone')
    await strip('academies', 'phone')
    await strip('academies', 'sms_sender_number')
    await strip('sms_send_logs', 'recipient_phone') // 과거 발송 이력, 안 건드려도 되면 이 줄은 빼도 돼요
  },

  async down() {
    // 하이픈 위치를 복원할 수 없어 되돌리지 않음
  },
}
