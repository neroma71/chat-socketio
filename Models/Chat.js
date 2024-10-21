const { DataTypes } = require("sequelize");

const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) =>{
    return sequelize.define("chat", {
        pseudo: DataTypes.STRING,
        text: DataTypes.STRING, // Change "m" en "text"
        room: DataTypes.STRING
    });
};