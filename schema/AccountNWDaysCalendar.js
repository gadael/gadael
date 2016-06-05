'use strict';

const accountPlanning = require('./AccountPlanning');

exports = module.exports = function(params) {

	let aNWDSchema = accountPlanning(params);

    params.db.model('AccountNWDaysCalendar', aNWDSchema);
};

