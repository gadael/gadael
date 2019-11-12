'use strict';

const companyApi = require('./api/Company.api');
const config = require('./config')();
const util = require('util');

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
        if (userAccounts.length > 0) {
            console.log(util.format('%d accounts to refresh', userAccounts.length));
        }

        return Promise.all(userAccounts.map(account => {
            return account.user.id.updateRenewalsStat()
            .then(() => {
                account.renewalStatsOutofDate = false;
                return account.save();
            });
        }));
    })
    .then(() => {
        process.exit();
    })
    .catch(console.error);
}

refreshStats();
