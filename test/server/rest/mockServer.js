'use strict';

exports = module.exports = function(readyCallback) {

    var api = require('../../../api/Company.api.js');
    var app = require('../../../api/Headless.api.js');

    var mockServerDbName = 'MockServerDb';

    var company = { 
        name: 'The Fake Company REST service',
        port: 3002 
    };

    app.connect(function() {
        api.isDbNameValid(app, mockServerDbName, function(status) {
            if (!status) {
                console.log('mock REST server: database allready exists');
                return;
            }
            
            api.createDb(app, mockServerDbName, company, function() {
                
                //TODO: start express app on custom port and use this database
                
                readyCallback();
            });
        });
    });
};
