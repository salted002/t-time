module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    'Student',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      classId: { type: Datatype.UUID, allowNull: true },
      status: {
        type: DataTypes.ENUM('재원', '휴원', '퇴원'),
        allowNull: false,
        defaultValue: '재원',
      },
      school: { type: DataTypes.STRING, allowNull: false },
      grade: { type: DataTypes.STRING, allowNull: false },
      parentPhone: { type: DataTypes.STRING, allowNull: false },
      enrolledAt: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      tableName: 'students',
    },
  )

  Student.associate = (models) => {
    Student.belongsTo(models.Academy, { foreignKey: 'academyId' })
    Student.belongsTo(models.Class, { foreignKey: 'classId' })

    Student.hasMany(models.StudentCounseling, { foreignKey: 'studentId' })
    Student.hasMany(models.ExamParticipant, {
      foreignKey: 'studentId',
      onDelete: 'SET NULL',
    })
    Student.hasMany(models.Report, { foreignKey: 'studentId' })
    Student.hasMany(models.SmsSendLog, {
      foreignKey: 'studentId',
      onDelete: 'SET NULL',
    })
  }

  return Student
}
