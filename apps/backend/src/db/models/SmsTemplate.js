module.exports = (sequelize, DataTypes) => {
  const SmsTemplate = sequelize.define(
    'SmsTemplate',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // 학원당 is_default=true는 1개까지만 — DB 제약 아님, 서비스 로직(앱 레벨)에서 보장해야 함
    },
    {
      tableName: 'sms_templates',
    },
  )

  SmsTemplate.associate = (models) => {
    SmsTemplate.belongsTo(models.Academy, { foreignKey: 'academyId' })
  }

  return SmsTemplate
}
