'use strict';

/**
 * Event workflow 
 * 
 * @property	int		httpstatus		Response HTTP code
 * @property	Object	outcome			client infos
 * 
 * 
 * the outcome object is sent to client in json format
 * 
 * success: workflow result
 * alert: a list of message with { type: 'success|info|warning|danger' message: '' } type is one of bootstrap alert class
 * errfor: name of fields to highlight to client (empty value)
 * 
 * 
 * @return EventEmitter
 */ 
exports = module.exports = function(req, res) {
  var workflow = new (require('events').EventEmitter)();
  
  workflow.httpstatus = 200;

  workflow.outcome = {
    success: false,
    alert: [], 
    errfor: {}
  };


  /**
   * @return bool
   */  
  workflow.hasErrors = function() {
	  
	if (Object.keys(workflow.outcome.errfor).length !== 0)
	{
		return true;
	}
	  
	for(var i=0; i<workflow.outcome.alert.length; i++)
	{
		if (workflow.outcome.alert[i].type === 'danger')
		{
			return true;
		}
	}
	  
    return false;
  };

  workflow.on('exception', function(err) {
    workflow.outcome.alert.push({ type:'danger' ,message: err});
    return workflow.emit('response');
  });

  workflow.on('response', function() {
    workflow.outcome.success = !workflow.hasErrors();
    res.status(workflow.httpstatus).send(workflow.outcome);
  });

  return workflow;
};
