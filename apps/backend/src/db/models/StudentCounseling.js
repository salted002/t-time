module.exports = (sequelize, DataTypes) => {
  const StudentCounseling = sequelize.define(
    'StudentCounseling',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      studentId: { type: DataTypes.UUID, allowNull: false },
      counselingDate: { type: DataTypes.DATEONLY, allowNull: false },
      target: {
        type: DataTypes.ENUM('학생', '보호자'),
        allowNull: false,
        defaultValue: '학생',
      },
      counselorName: { type: DataTypes.STRING, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'student_counselings',
    },
  )

  StudentCounseling.associate = (models) => {
    StudentCounseling.belongsTo(models.Student, { foreignKey: 'studentId' })
  }

  return StudentCounseling
}
