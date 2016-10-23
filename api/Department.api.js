'use strict';

let api = {};
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
 *
 * @return {Promise}
 */
api.populate = function(app, department, nbUsers, password) {

    const Charlatan = require('charlatan');
    let userApi = require('./User.api');

    let promises = [];

    promises.push(userApi.createRandomManager(app, Charlatan.Internet.safeEmail(), password));

    for (let u=0; u<nbUsers; u++) {
        promises.push(userApi.createRandomAccount(app, Charlatan.Internet.safeEmail(), password));
    }

    let saves = [];

    return Promise.all(promises)
    .then(randomUsers => {
        return randomUsers[0].user.getManager()
        .then(managerDocument => {
            managerDocument.department = [department._id];
            saves.push(managerDocument.save());
            return randomUsers;
        });
    })
    .then(randomUsers => {
        randomUsers.forEach(randomUser => {
            randomUser.user.department = department._id;
            saves.push(randomUser.user.save());
        });

        return Promise.all(saves)
        .then(() => {
            return randomUsers;
        });
    });
};

/**
 * Populate a department for documentation screenshots
 *
 * @param {Express}    app
 * @param {Department} department A created department object
 *
 * @return {Promise}
 */
api.populateScreenshots = function(app, department) {

    let userApi = require('./User.api');

    let promises = [];

    promises.push(userApi.createRandomManager(app, 'manager@example.com', 'secret', 'Doe', 'Jane'));

    promises.push(userApi.createRandomAccount(app, 'user1@example.com', 'secret', 'Cannella', 'Pamila'));
    promises.push(userApi.createRandomAccount(app, 'user2@example.com', 'secret', 'Pitcher', 'Malcolm'));
    promises.push(userApi.createRandomAccount(app, 'user3@example.com', 'secret', 'Mcgee', 'Lincoln'));


    let saves = [];

    return Promise.all(promises)
    .then(randomUsers => {
        return randomUsers[0].user.getManager()
        .then(managerDocument => {
            managerDocument.department = [department._id];
            saves.push(managerDocument.save());
            return randomUsers;
        });
    })
    .then(randomUsers => {
        let collectionPromises = [];
        for (let i=1; i<randomUsers.length; i++) { // ignore first, not an account
            collectionPromises.push(userApi.linkToDefaultCollection(app, randomUsers[i]));
        }

        return Promise.all(collectionPromises)
        .then(() => {
            return randomUsers;
        });
    })
    .then(randomUsers => {
        randomUsers.forEach(randomUser => {
            randomUser.user.department = department._id;
            saves.push(randomUser.user.save());
        });

        return Promise.all(saves)
        .then(() => {
            return randomUsers;
        });
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
                    manager: randomUsers.shift(),
                    members: randomUsers
                };

                resolve(randomDepartment);
            }).catch(reject);
        }).catch(reject);
    });
};


/**
 * Create a department with a population for documentation screenshot
 * @param {Express} app
 * @param {String}  parent   Parent department ID
 *
 * @return {Promise}    Resolve to the randomDepartment object
 */
api.createScreenshotDepartment = function(app, parent) {
    const gt = app.utility.gettext;
    return new Promise((resolve, reject) => {
        api.create(app, parent, gt.gettext('Products and sales')).then(department => {
            api.populateScreenshots(app, department)
            .then(randomUsers => {

                let randomDepartment = {
                    department: department,
                    manager: randomUsers.shift(),
                    members: randomUsers
                };

                resolve(randomDepartment);
            }).catch(reject);
        }).catch(reject);
    });
};
