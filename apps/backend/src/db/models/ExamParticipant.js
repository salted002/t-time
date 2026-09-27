module.exports = (sequelize, DataTypes) => {
  const ExamParticipant = sequelize.define(
    'ExamParticipant',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      examId: { type: DataTypes.UUID, allowNull: false },
      studentId: { type: DataTypes.UUID, allowNull: true },
      studentNameSnapshot: { type: DataTypes.STRING, allowNull: false }, 
      teacherComment: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'exam_participants',
    },
  )

  ExamParticipant.associate = (models) => {
    ExamParticipant.belongsTo(models.Exam, { foreignKey: 'examId' })
    ExamParticipant.belongsTo(models.Student, { foreignKey: 'studentId' })
    ExamParticipant.hasMany(models.ExamScore, {
      foreignKey: 'participantId',
      onDelete: 'CASCADE',
    })
  }

  return ExamParticipant
}
