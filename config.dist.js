const fs = require('fs');
const createDefault = require('./config.example');

/**
 * Module to create a new config object
 * @return object
 */
exports = module.exports = function createConfiguration() {

    'use strict';

    // This is a configuration file for distributions packages,
    // if this file is named config.js, please set options in /etc/gadael/config.json

    let config = Object.assign(
        createDefault(),
        JSON.parse(fs.readFileSync('/etc/gadael/config.json', 'utf8'))
    );

    return config;
};
