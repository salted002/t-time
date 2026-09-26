module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      academyId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'users',
    },
  )

  User.associate = (models) => {
    User.belongsTo(models.Academy, { foreignKey: 'academyId' })
  }

  return User
}
