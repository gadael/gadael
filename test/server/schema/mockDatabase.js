'use strict';

var api = require('../../../api/Company.api.js');
var headless = require('../../../api/Headless.api.js');


function mockDatabase(dbname, done)
{


    var company = {
        name: 'Mock '+dbname,
        port: 80 // not used

    };

    api.dropDb(headless, 'userSpec', function() {



        api.createDb(headless, dbname, company, function() {

            var config = require('../../../config')();
            var models = require('../../../models');

            config.port = company.port;
            config.companyName = company.name;
            config.mongodb.dbname = dbname;

            var app = api.getExpress(config, models);


            app.disconnect = function(callback) {
                app.db.close(function () {
                    if (callback) {
                        callback();
                    }
                });
            };

            done(app);
        });

     });
}


var expapp;

exports = module.exports = {

    /**
     * Function loaded in a beforeEach to ensure the server is started for every test
     * This start only one instance
     */
    mockDatabase: function(dbname, ready) {

        if (!expapp) {
            mockDatabase(dbname, function(app) {
                expapp = app;
                ready(app);
            });

        } else {

            ready(expapp);
        }

        return expapp;
    },


    dropDb: function(dbname, ready) {
        api.dropDb(headless, dbname, ready);
    }
};
