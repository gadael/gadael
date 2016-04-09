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
    const DepartmentModel = app.db.models.Department;

    return new Promise((resolve, reject) => {

        DepartmentModel.find({}, (err, list) => {

            const allNames = list.map(d => {
                return d.name;
            });

            let maxTry = 30;

            if (!name) {
                do {
                    name = Charlatan.Commerce.department();
                    maxTry--;

                    if (maxTry <= 0) {
                        return reject('Failed to create random department name from Charlatan.Commerce.department (30 retry excedeed)');
                    }

                } while(-1 !== allNames.indexOf(name));
            }

            let department = new DepartmentModel();

            department.name = name;
            department.parent = parent;

            if (undefined !== operator) {
                department.operator = operator;
            }

            resolve(department.save());
        });
    });


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

        promises.push(userApi.createRandomManager(app, Charlatan.Internet.safeEmail(), password));

        for (let u=0; u<nbUsers; u++) {
            promises.push(userApi.createRandomAccount(app, Charlatan.Internet.safeEmail(), password));
        }

        Promise.all(promises).then(randomUsers => {

            let promises = [];

            randomUsers.forEach(randomUser => {
                randomUser.user.department = department._id;
                promises.push(randomUser.user.save());

            });

            Promise.all(promises).then(() => {
                resolve(randomUsers);
            }).catch(reject);


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
 * @return {Promise}    Resolve to the randomDepartment object
 */
api.createRandom = function(app, parent, nbUsers, password) {
    return new Promise((resolve, reject) => {
        api.create(app, parent).then(department => {
            api.populate(app, department, nbUsers, password)
            .then(randomUsers => {

                let randomDepartment = {
                    department: department,
                    manager: randomUsers.pop(),
                    members: randomUsers
                };

                resolve(randomDepartment);
            }).catch(reject);
        }).catch(reject);
    });
};
