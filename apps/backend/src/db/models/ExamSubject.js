module.exports = (sequelize, DataTypes) => {
  const ExamSubject = sequelize.define(
    'ExamSubject',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      examId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      maxScore: { type: DataTypes.DECIMAL(5, 1), allowNull: true }, // O, eval_type=score_max일 때만 필수(앱 레벨 검증)
    },
    {
      tableName: 'exam_subjects',
    },
  )

  ExamSubject.associate = (models) => {
    ExamSubject.belongsTo(models.Exam, { foreignKey: 'examId' })

    // 시험 삭제 시 시험 성적 & 시험 응시자 cascade 삭제
    ExamSubject.hasMany(models.ExamScore, {
      foreignKey: 'subjectId',
      onDelete: 'CASCADE',
    })
  }

  return ExamSubject
}
