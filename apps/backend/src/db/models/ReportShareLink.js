module.exports = (sequelize, DataTypes) => {
  const ReportShareLink = sequelize.define(
    'ReportShareLink',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      reportId: { type: DataTypes.UUID, allowNull: false },
      token: { type: DataTypes.STRING, allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'report_share_links',
    },
  )

  ReportShareLink.associate = (models) => {
    ReportShareLink.belongsTo(models.Report, { foreignKey: 'reportId' })
    ReportShareLink.hasMany(models.SmsSendLog, {
      foreignKey: 'reportShareLinkId',
      onDelete: 'SET NULL',
    })
  }

  return ReportShareLink
}
