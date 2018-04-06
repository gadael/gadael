'use strict';

/**
 * Get a label for display unit
 * @param {string} unit
 * @param {Number} [quantity]
 */
exports = module.exports = function(app) {

    let config = app.config;

    return function(req, res, next) {
        if (config.company.disabled) {
            res.status(401).send('Site disabled by administrator');
            return;
        }

        next();

        // Update lastMinRefresh if necessary

        let now, setNow = true;

        now = new Date();

        if (config.company.lastMinRefresh) {
            let age = now.getTime() - config.company.lastMinRefresh.getTime();
            setNow = age > 300000; // 5min
        }

        if (setNow && req.user) {
            config.company.lastMinRefresh = now;
            config.company.save();
        }

        // Kill the app if inactivity timeout is configured

        if (null !== config.inactivityTimeout) {

            if (undefined !== app.inactivity) {
                clearTimeout(app.inactivity);
            }

            app.inactivity = setTimeout(function() {
                console.log('Exit because of inactivity timeout');
                process.exit();
            }, config.inactivityTimeout * 60000);
        }
    };
};
