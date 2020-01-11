'use strict';

const util = require('util');

const api = {
    company: require('./api/Company.api'),
    headless: require('./api/Headless.api')
};



let dbName = process.argv[2] || 'gadael';

let companyValues = {
    name: process.argv[3] || 'Gadael'
};

if (undefined !== process.argv[4]) {
    companyValues.country = process.argv[4];
}

api.company.createDb(api.headless, dbName, companyValues)
.then(company => {
    console.log(util.format('Database %s created, please use `node app.js 3000 %s` to start your Gadael instance', dbName, dbName));
    process.exit();
})
.catch(console.error);
