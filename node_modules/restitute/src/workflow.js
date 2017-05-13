

/**
 * Event workflow
 *
 * @property	int		httpstatus		Response HTTP code
 * @property	Object	document		the processed document, will be return by the http query for save method (mongoose document)
 * @property	Object	outcome			client infos
 *
 *
 * the outcome object is sent to client in json format inside the document in the $outcome property
 *
 * success: workflow result
 * alert: a list of message with { type: 'success|info|warning|danger' message: '' } type is one of bootstrap alert class
 * errfor: name of fields to highlight to client (empty value)
 *
 * @return EventEmitter
 */
exports = module.exports = function(req, res) {
    'use strict';

    var workflow = new (require('events').EventEmitter)();

    workflow.httpstatus = 200;

    workflow.document = null;


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

    /**
    * Test required fields in req.body
    * @return bool
    */
    workflow.needRequiredFields = function(list) {


         for(var i=0; i<list.length; i++)
         {
            if (!req.body[list[i]]) {
                workflow.outcome.errfor[list[i]] = 'required';
                workflow.httpstatus = 400; // Bad Request
            }
         }

         return this.hasErrors();
    };

    /**
    * emit exception if parameter contain a mongoose error
    */
    workflow.handleMongoError = function(err) {
      if (err) {

          console.trace(err);

          workflow.httpstatus = 400; // Bad Request

          if (err.errors) {
              for(var field in err.errors) {
                  var e = err.errors[field];
                  workflow.outcome.errfor[field] = e.type;
                  workflow.outcome.alert.push({ type:'danger' ,message: e.message});
              }
          }

          workflow.outcome.alert.push({ type:'danger' ,message: err.message});

          workflow.emit('response');
          return false;
      }

      return true;
    };


    workflow.success = function(message) {
        workflow.outcome.alert.push({
            type: 'success',
            message: message
        });

        workflow.emit('response');
    };


    workflow.on('exception', function(err) {
        workflow.outcome.alert.push({ type:'danger' ,message: err});
        return workflow.emit('response');
    });


    workflow.on('response', function() {
        workflow.outcome.success = !workflow.hasErrors();

        if (!workflow.document) {
            // console.log('missing document in outcome');
            workflow.document = {}; // return empty document
        }

        if (workflow.document.constructor.name === 'model') {
            // force as a plain object to add the new property
            workflow.document = workflow.document.toObject();
        }

        workflow.document.$outcome = workflow.outcome;

        res.status(workflow.httpstatus).send(workflow.document);
    });



    return workflow;
};
