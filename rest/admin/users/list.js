'use strict';

var listController = require('../../controller').list;


var controller = new listController('/rest/admin/users');
exports = module.exports = controller;

controller.controllerAction = function() {
    
    var ctrl = this;

    var query = function(next) {
        
        var find = ctrl.models.User.find();
        
        if (ctrl.req.param('name'))
        {
            find.or([
                { firstname: new RegExp('^'+ctrl.req.param('name'), 'i') },
                { lastname: new RegExp('^'+ctrl.req.param('name'), 'i') }
            ]);

        }
        
        if (ctrl.req.param('department'))
        {
            find.where('department').equals(ctrl.req.param('department'));

        }
        
        if (ctrl.req.param('collection'))
        {
            var collFind = ctrl.models.AccountCollection.find();
            collFind.where('rightCollection').equals(ctrl.req.param('collection'));
            collFind.select('account');
            
            collFind.exec(function (err, docs) {
                if (ctrl.workflow.handleMongoError(err))
                {
                    var accountIdList = [];
                    for(var i=0; i<docs.length; i++) {
                        accountIdList.push(docs[i]._id);
                    }
                    
                    find.where('roles.account').in(accountIdList);
                    next(find);
                }
            });

        } else {
            next(find);
        }
    };
    
    

    query(function(find) {

        ctrl.paginate(find).then(function(p) {

            query(function(find) {
                
                var q = find.select('lastname firstname email roles isActive').sort('lastname');
            
                q.limit(p.limit);
                q.skip(p.skip);

                q.exec(function (err, docs) {
                    if (ctrl.workflow.handleMongoError(err))
                    {
                        ctrl.res.json(docs);
                    }
                });
                
            });
        });
        
    });

};


