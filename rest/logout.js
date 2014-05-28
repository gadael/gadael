'use strict';

exports.init = function(req, res){
	
	var workflow = req.app.utility.workflow(req, res);
	
	req.logout();

	workflow.emit('response');
};
