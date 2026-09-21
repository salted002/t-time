'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_scores', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exam_participants', key: 'id' },
        onDelete: 'CASCADE'
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exam_subjects', key: 'id' },
        onDelete: 'CASCADE'
      },
      score: { type: Sequelize.DECIMAL(5, 1), allowNull: true }, // 미응시(null) 허용
      grade_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exam_grades', key: 'id' },
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // TODO(팀 논의 필요): 한 응시자가 같은 과목 점수를 중복으로 갖지 않도록
    // (participant_id, subject_id) UNIQUE 제약을 걸지 여부 — 아직 미반영
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exam_scores');
  }
};
