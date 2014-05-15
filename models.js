'use strict';

exports = module.exports = function(app, mongoose) {
  //embeddable docs first
  require('./schema/Status')(app, mongoose);
  require('./schema/StatusLog')(app, mongoose);

  //then regular docs
  require('./schema/User')(app, mongoose);
  require('./schema/Admin')(app, mongoose);
  require('./schema/AdminGroup')(app, mongoose);
  require('./schema/Account')(app, mongoose);
  require('./schema/LoginAttempt')(app, mongoose);
};
