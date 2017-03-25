'use strict';

const companyApi = require('./api/Company.api');
const headless = require('./api/Headless.api');
let config;

//dependencies
try {
    config = require('./config')();
} catch(e) {
    throw new Error(e+' Please copy config.example.js to config.js');
}


let models = require('./models');


/**
 * Start the application
 */
function start() {
    let app = companyApi.getExpress(config, models);
    app.server = companyApi.startServer(app, function() {
        //and... we're live
    });
}

if (false === config.mongodb.init) {
    start();

} else {

    // The best way to initialize the database is to use the install.js script
    // here we set default company name and contry because there is no way to set this
    // on commmand line

    let companyValues = {
        name: 'Gadael',
        contry: 'FR'
    };

    companyApi.createDb(headless, config.mongodb.dbName, companyValues)
    .then(company => {
        // This is a first start, with db initialization
        start();
    })
    .catch(err => {
        // wee ignore the error because the database probably allready exists
        start();
    });
}
