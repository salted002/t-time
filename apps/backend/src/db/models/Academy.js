module.exports = (sequelize, DataTypes) => {
  const Academy = sequelize.define(
    'Academy',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      // allowNull의 기본값은 true
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      businessNumber: { type: DataTypes.STRING, allowNull: false },
      ownerName: { type: DataTypes.STRING, allowNull: false },
      logoUrl: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: true },
      smsSenderNumber: { type: DataTypes.STRING, allowNull: true },
      subscriptionStatus: {
        type: DataTypes.ENUM('FREE', 'SUBSCRIBED'),
        allowNull: false,
        defaultValue: 'FREE',
      },
      subscribedAt: { type: DataTypes.DATE, allowNull: true },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'academies',
      paranoid: false, // soft-delete
      // 기본값 timestamps: true → createdAt & updatedAt 명시하지 않아도 자동 생성됨. (단, sequelize로 조작할 때만)
    },
  )

  Academy.associate = (models) => {
    Academy.hasOne(models.User, { foreignKey: 'academyId' })
    Academy.hasMany(models.Class, { foreignKey: 'academyId' })
    Academy.hasMany(models.Student, { foreignKey: 'academyId' })
    Academy.hasMany(models.Exam, { foreignKey: 'academyId' })
    Academy.hasMany(models.Report, { foreignKey: 'academyId' })
    Academy.hasMany(models.SmsSendLog, { foreignKey: 'academyId' })
    Academy.hasMany(models.SmsTemplates, { foreignKey: 'academyId' })
  }
  return Academy
}
