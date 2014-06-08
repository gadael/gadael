'use strict';

exports = module.exports = function(app, mongoose) {
  //embeddable docs first
	require('./schema/Status')(app, mongoose);
	require('./schema/StatusLog')(app, mongoose);
	require('./schema/RequestLog')(app, mongoose);
	require('./schema/Request_AbsenceElem')(app, mongoose);
	require('./schema/AccountCollection')(app, mongoose);

  //then regular docs
  require('./schema/User')(app, mongoose);
  require('./schema/User_Admin')(app, mongoose);
  require('./schema/User_Account')(app, mongoose);
  require('./schema/Department')(app, mongoose);
  require('./schema/LoginAttempt')(app, mongoose);
  require('./schema/Request')(app, mongoose);
  
};
