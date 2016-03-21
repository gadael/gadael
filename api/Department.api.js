'use strict';

var api = {};
exports = module.exports = api;


/**
 * Create random department
 *
 * @param {Express} app
 * @param {String} parent
 * @param {String} [name]
 *
 * @return {Promise}
 */
api.create = function(app, parent, name, operator) {

    const Charlatan = require('charlatan');
    let DepartmentModel = app.db.models.Department;
    let department = new DepartmentModel();

    department.name = name || Charlatan.Commerce.department();
    department.parent = parent;

    if (undefined !== operator) {
        department.operator = operator;
    }

    return department.save();
};


/**
 * Populate a department with random users and one manager
 * all with the same password for tests
 *
 * @param {Express}    app
 * @param {Department} department A created department object
 * @param {Int}        nbUsers    Number of members in department (other than manager)
 */
api.populate = function(app, department, nbUsers, password) {

    const Charlatan = require('charlatan');
    let userApi = require('./User.api');

    return new Promise((resolve, reject) => {

        let promises = [];

        let managerPromise = userApi.createRandomManager(app, Charlatan.Internet.safeEmail(), password);
        promises.push(managerPromise);

        for (let u=0; u<nbUsers; u++) {
            promises.push(userApi.createRandomAccount(app, Charlatan.Internet.safeEmail(), password));
        }

        Promise.all(promises).then(randomUsers => {

            let promises = [];

            randomUsers.forEach(randomUser => {
                randomUser.user.department = department._id;
                promises.push(randomUser.user.save());
            });

            resolve(Promise.all(promises));

        }).catch(reject);

    });
};


/**
 * Create a random department with a population
 * @param {Express} app
 * @param {String}  parent   Parent department ID
 * @param {Int}     nbUsers  Number of members in department (other than manager)
 * @param {String}  password Password for all random users in department
 *
 * @return {Promise}    Resolve to the department object
 */
api.createRandom = function(app, parent, nbUsers, password) {
    return new Promise((resolve, reject) => {
        api.create(app, parent).then(department => {
            api.populate(app, department, nbUsers, password)
            .then(() => {
                resolve(department);
            }).catch(reject);
        }).catch(reject);
    });
};
