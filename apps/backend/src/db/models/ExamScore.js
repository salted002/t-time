module.exports = (sequelize, DataTypes) => {
  const ExamScore = sequelize.define(
    'ExamScore',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      participantId: { type: DataTypes.UUID, allowNull: false },
      subjectId: { type: DataTypes.UUID, allowNull: false },
      score: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
      gradeId: { type: DataTypes.UUID, allowNull: true },
    },
    {
      tableName: 'exam_scores',
    },
  )

  ExamScore.associate = (models) => {
    ExamScore.belongsTo(models.ExamParticipant, { foreignKey: 'participantId' })
    ExamScore.belongsTo(models.ExamSubject, { foreignKey: 'subjectId' })
    ExamScore.belongsTo(models.ExamGrade, { foreignKey: 'gradeId' })
  }

  return ExamScore
}
