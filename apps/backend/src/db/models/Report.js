module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    'Report',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      studentId: { type: DataTypes.UUID, allowNull: false },
      examIds: { type: DataTypes.JSON, allowNull: false }, // 최근 10회 기준 시험 ID 목록
      subjectNames: { type: DataTypes.JSON, allowNull: false }, // 생성 시 선택한 과목명 목록
      aiFeedback: { type: DataTypes.TEXT, allowNull: true }, // 저장 시점에만 생성되는 스냅샷
    },
    {
      tableName: 'reports',
    },
  )

  Report.associate = (models) => {
    Report.belongsTo(models.Academy, { foreignKey: 'academyId' })
    Report.belongsTo(models.Student, { foreignKey: 'studentId' })
    Report.hasMany(models.ReportShareLink, {
      foreignKey: 'reportId',
      onDelete: 'CASCADE',
    })
  }

  return Report
}
