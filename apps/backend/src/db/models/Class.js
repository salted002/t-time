module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define(
    'Class',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      name: { type: dataTypes.STRING, allowNull: false },
      teacherName: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'classes',
    },
  )

  Class.associate = (models) => {
    Class.belongsTo(models.Academy, { foreignKey: 'academyId' })
    // 반 삭제 시 학생은 유지, class_id만 set null
    Class.hasMany(models.Student, { foreignKey: 'classId', onDelete: 'SET NULL' })
    Class.hasMany(models.Exam, { foreignKey: 'classId', onDelete: 'SET NULL' })
  }
}
