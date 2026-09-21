module.exports = (sequelize, DataTypes) => {
  const SmsSendLog = sequelize.define(
    'SmsSendLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      studentId: { type: DataTypes.UUID, allowNull: true },
      studentNameSnapshot: { type: DataTypes.STRING, allowNull: false },
      recipientPhone: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      reportShareLinkId: { type: DataTypes.UUID, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('성공', '실패'), allowNull: false },
    },
    {
      tableName: 'sms_send_logs',
    },
  )

  SmsSendLog.associate = (models) => {
    SmsSendLog.belongsTo(models.Academy, { foreignKey: 'academyId' })
    SmsSendLog.belongsTo(models.Student, { foreignKey: 'studentId' })
    SmsSendLog.belongsTo(models.ReportShareLink, {
      foreignKey: 'reportShareLinkId',
    })
  }

  return SmsSendLog
}
