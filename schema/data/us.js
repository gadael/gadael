'use strict';

module.exports = exports = function(app) {

    const gt = app.utility.gettext;

    return {
        rights: [
            {
                name: gt.gettext('Sickness absence'),
                type: '5740adf51cf1a569643cc50b',
                quantity: null,
                activeFor: { account: false },
                autoDistribution: false,
                renewal: {
                    start: {
                        month:0,
                        day:1
                    },
                    nbYears: 100
                }
            },
            {
                name: gt.gettext('Unpaid leave'),
                type: '5740adf51cf1a569643cc516',
                quantity: null,
                autoDistribution: false,
                renewal: {
                    start: {
                        month:0,
                        day:1
                    },
                    nbYears: 100
                }
            }
        ]
    };
};
