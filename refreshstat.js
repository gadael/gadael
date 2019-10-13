'use strict';

const companyApi = require('./api/Company.api');
const config = require('./config')();

/**
 * Script used to refresh users cache only when needed
 * This is the script to use with the useSchudeledRefreshStat=true option
 * with cron.hourly or cron.daily
 */
function refreshStats() {
    let models = require('./models');
    let app = companyApi.getExpress(config, models);
    return app.db.models.Account.find()
    .where('renewalStatsOutofDate').equals(true)
    .populate('user.id')
    .exec()
    .then(userAccounts => {
        console.log(userAccounts.length);
        return Promise.all(userAccounts.map(account => {
            return account.user.id.updateRenewalsStat();
        }));
    })
    .then(() => {
        process.exit();
    })
    .catch(console.error);
}

refreshStats();
