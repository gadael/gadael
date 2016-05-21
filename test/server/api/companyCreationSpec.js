'use strict';


const headless = require('../../../api/Headless.api.js');
const api = require('../../../api/Company.api.js');
let config = require('../../../config')();
let models = require('../../../models');



function createCompany(dbname, company, ready) {
    api.createDb(headless, dbname, company, function() {

        config.port = company.port;
        config.companyName = company.name;
        config.mongodb.dbname = dbname;
        config.csrfProtection = false;

        let app = api.getExpress(config, models);

        function drop(doneExit) {

            app.db.close(function() {

                api.dropDb(headless, dbname, doneExit);
            });
        }

        ready(app, drop);
    });
}


/**
 * Count rows in created company
 * @param {string} dbname  [[Description]]
 * @param {object} company [[Description]]
 * @return {Promise}
 */
function countRows(dbname, company) {

    function countPromise(model) {
        return new Promise((res, rej) => {
            model.count((err, count) => {
                if (err) {
                    return rej(err);
                }

                res(count);
            });
        });
    }

    return new Promise((resolve, reject) => {
        createCompany(dbname, company, (app, closeCb) => {
            let promises = [];
            promises.push(countPromise(app.db.models.Calendar));
            promises.push(countPromise(app.db.models.Type));
            promises.push(countPromise(app.db.models.RecoverQuantity));
            promises.push(countPromise(app.db.models.RightCollection));
            promises.push(countPromise(app.db.models.Right));


            Promise.all(promises).then(count => {
                closeCb(() => {
                    resolve(count);
                });
            }).catch(reject);
        });
    });
}


describe("Test company creation", function companyCreation() {



    it("verify initialization with no country set on company", function(done) {

        countRows('companyCreationNoCountry', {
            port: 2800,
            name: 'No country'
        }).then(count => {
            expect(count[0]).toEqual(1); // Calendar
            expect(count[1]).toEqual(21); // Type
            expect(count[2]).toEqual(4); // RecoverQuantity
            expect(count[3]).toEqual(3); // RightCollection

            done();
        }).catch(done);
    });



    it("verify initialization with FR", function(done) {

        countRows('companyCreationFr', {
            port: 2800,
            name: 'FR',
            country: 'FR'
        }).then(count => {
            expect(count[0]).toBeGreaterThan(1); // Calendar
            expect(count[1]).toBeGreaterThan(23); // Type
            expect(count[2]).toEqual(4); // RecoverQuantity
            expect(count[3]).toEqual(3); // RightCollection

            done();
        }).catch(done);
    });


    it("verify initialization with UK", function(done) {

        countRows('companyCreationUk', {
            port: 2800,
            name: 'UK',
            country: 'UK'
        }).then(count => {
            expect(count[0]).toEqual(4); // Calendar
            expect(count[1]).toEqual(21); // Type
            expect(count[2]).toEqual(4); // RecoverQuantity
            expect(count[3]).toEqual(3); // RightCollection

            done();
        }).catch(done);
    });


});







