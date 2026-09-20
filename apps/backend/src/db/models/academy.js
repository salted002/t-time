'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Academy extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Academy.init({
    name: DataTypes.STRING,
    slug: DataTypes.STRING,
    businessNumber: DataTypes.STRING,
    ownerName: DataTypes.STRING,
    logoUrl: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    smsSenderNumber: DataTypes.STRING,
    subscriptionStatus: DataTypes.STRING,
    subscribedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Academy',
  });
  return Academy;
};