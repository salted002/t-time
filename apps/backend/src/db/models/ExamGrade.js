module.exports = (sequelize, DataTypes) => {
  const ExamGrade = sequelize.define(
    'ExamGrade',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      examId: { type: DataTypes.UUID, allowNull: false },
      label: { type: DataTypes.STRING, allowNull: false },
      order: { type: DataTypes.INTEGER, allowNull: false }, // 등급 순서 (최고 → 최저)
    },
    {
      tableName: 'exam_grades',
    },
  )

  ExamGrade.associate = (models) => {
    ExamGrade.belongsTo(models.Exam, { foreignKey: 'examId' })
    ExamGrade.hasMany(models.ExamScore, {
      foreignKey: 'gradeId',
      onDelete: 'SET NULL',
    })
  }

  return ExamGrade
}
