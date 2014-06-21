'use strict';

var models = {};

exports = module.exports = models;

// 
models.requirements = {
	mongoose: null,		// the mongoose object
	db: null,			// database connexion to link with shemas
	autoIndex: false	// boolean used to autoindex schemas
};
	



models.load = function() {
	
	var requirements = this.requirements;
	
	//embeddable docs first
	require('./schema/Status')(requirements);
	require('./schema/StatusLog')(requirements);
	require('./schema/RequestLog')(requirements);
	require('./schema/Request_AbsenceElem')(requirements);
	require('./schema/AccountCollection')(requirements);

	//then regular docs
	require('./schema/User')(requirements);
	require('./schema/User_Admin')(requirements);
	require('./schema/User_Account')(requirements);
	require('./schema/Department')(requirements);
	require('./schema/LoginAttempt')(requirements);
	require('./schema/Request')(requirements);
  
	require('./schema/RightCollection')(requirements);
};
