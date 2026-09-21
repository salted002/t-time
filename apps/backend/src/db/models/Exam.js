module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define(
    'Exam',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      classId: { type: DataTypes.UUID, allowNull: true },
      examDate: { type: DataTypes.DATEONLY, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      evalType: {
        type: DataTypes.ENUM('score', 'score_max', 'grade'),
        allowNull: false,
      },
      memo: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'exams',
    },
  )

  Exam.associate = (models) => {
    Exam.belongsTo(models.Academy, { foreignKey: 'academyId' })
    Exam.belongsTo(models.Class, { foreignKey: 'classId' })

    Exam.hasMany(models.ExamSubject, {
      foreignKey: 'examId',
      onDelete: 'CASCADE',
    })
    Exam.hasMany(models.ExamGrade, {
      foreignKey: 'examId',
      onDelete: 'CASCADE',
    })
    Exam.hasMany(models.ExamParticipant, {
      foreignKey: 'examId',
      onDelete: 'CASCADE',
    })
  }
  return Exam
}
