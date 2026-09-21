module.exports = (sequelize, DataTypes) => {
  const PlatformAdmin = sequelize.define(
    'PlatformAdmin',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'platform_admins',
    },
  )

  // academies/users와 완전 분리된 별도 인증 체계라 다른 모델과의 associate는 없음

  return PlatformAdmin
}
