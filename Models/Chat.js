const { DataTypes } = require("sequelize");

const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) =>{
    return sequelize.define("chat",{
        pseudo: Sequelize.STRING,
        m: Sequelize.STRING,
        room: Sequelize.STRING
    });
};