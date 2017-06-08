'use strict';

const companyApi = require('./api/Company.api');
const config = require('./config')();
const util = require('util');

/**
 * Script used to refresh users cache after a database modification or a bug
 */
function repairStats() {
    let models = require('./models');
    let app = companyApi.getExpress(config, models);
    app.server = companyApi.startServer(app, function() {
        app.db.models.User.find()
        .exec()
        .then(users => {
            return Promise.all(users.map(user => {
                return user.updateRenewalsStat();
            }));
        })
        .then(all => {
            console.log(util.format('%d users updated, this server can be closed manually'), all.length);
        });
    });
}


repairStats();
