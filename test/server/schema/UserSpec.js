'use strict';

var helpers = require('./mockDatabase');


describe('User model', function() {

    var app;
    var userModel, managerModel;
    var userDocument, userManagerDocument, manager;
    var department1, department2;
    var collection1, collection2;
    var accountCollection1, accountCollection2;
    var changeCollectionDate;

    beforeEach(function(done) {
        helpers.mockDatabase('userSpec', function(mockapp) {
            app = mockapp;

            userModel = app.db.models.User;
            managerModel = app.db.models.Manager;

            done();
        });
    });


    it('create a random test user', function(done) {
        userModel.createRandom('secret', function(err, user) {
            userDocument = user;
            done();
        });
    });


    it('add the account role', function(done) {
        var account = new app.db.models.Account();
        account.save(function(err, account) {
            userDocument.roles.account = account._id;
            userDocument.save(function(err, saved) {
                expect(err).toEqual(null);
                done();
            });
        });


    });


    it('check departments ancestors without departments', function(done) {
        userDocument.getDepartmentsAncestors().then(function(arr) {
            expect(arr.length).toEqual(0);
            done();
        });
    });


    it('set a department on test user', function(done) {

        function saveToUser(department) {

            userDocument.department = department._id;
            userDocument.save(function(err) {
                expect(err).toEqual(null);
                department1 = department;
                done();
            });
        }

        app.db.models.Department.findOne().where('name', 'R & D').exec(function(err, department) {
            expect(err).toEqual(null);
            if (department) {
                return saveToUser(department);
            }

            department = new app.db.models.Department();
            department.name = 'R & D';
            department.save(function(err) {
                expect(err).toEqual(null);
                saveToUser(department);


            });
        });
    });


    it('check departments ancestors with one department', function(done) {
        userDocument.getDepartmentsAncestors().then(function(arr) {
            expect(arr.length).toEqual(1);
            done();
        });
    });


    it('create a parent department', function(done) {

        function saveToDepartment1(department) {
            department1.parent = department;
            department1.save(function(err) {
                expect(err).toEqual(null);
                department2 = department;
                done();
            });
        }



        app.db.models.Department.findOne().where('name', 'France').exec(function(err, department) {

            expect(err).toEqual(null);
            if (department) {

                return saveToDepartment1(department);
            }

            department = new app.db.models.Department();
            department.name = 'France';
            department.save(function(err) {

                expect(err).toEqual(null);
                saveToDepartment1(department);
            });
        });
    });





    it('check departments ancestors with two department', function(done) {
        userDocument.getDepartmentsAncestors().then(function(arr) {
            expect(arr.length).toEqual(2);
            done();
        });
    });


    it('Create a manager', function(done) {
        userModel.createRandom('secret', function(err, user) {
            manager = new managerModel();
            manager.user = {
                    id: user._id,
                    name: user.getName()
                };
            manager.department = [department2._id];

            manager.save(function(err, managerDocument) {
                user.roles = {
                    manager: managerDocument._id
                };

                user.save(function(err, userManager) {
                    expect(err).toEqual(null);
                    expect(userManager.roles.manager).toEqual(managerDocument._id);
                    userManagerDocument = userManager;
                    done();
                });
            });


        });
    });


    it('verify manager of a user', function(done) {
        userManagerDocument.populate('roles.manager', function(err, populatedManager) {
            populatedManager.isManagerOf(userDocument).then(function(status) {
                expect(status).toBeTruthy();
                done();
            }).catch(function(err) {
                expect(err.toString()).toEqual(null);
                done();
            });
        });

    });



    it('verify manager can spoof user to edit requests with the default settings', function(done) {
        userManagerDocument.canSpoofUser(userDocument).then(function(status) {
            expect(status).toBeTruthy();
            done();
        }).catch(function(err) {
            expect(err.toString()).toEqual(null);
            done();
        });
    });


    it('change setting in the company document', function(done) {

        app.db.models.Company.findOne({}, function(err, company) {

            expect(err).toEqual(null);
            expect(company).toBeDefined();
            if (!company) {
                expect(false).toEqual(true);
                done();
                return;
            }

            if (null === company.manager_options) {
                company.manager_options = {};
            }

            company.manager_options.edit_request = false;
            company.save(function(err) {
                expect(err).toEqual(null);
                done();
            });
        });

    });


    it('verify manager cannot spoof user to edit request with the modified setting', function(done) {
        userManagerDocument.canSpoofUser(userDocument).then(function(status) {
            expect(status).toBeFalsy();
            done();
        }).catch(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('create a test collection', function(done) {
        collection1 = new app.db.models.RightCollection();
        collection1.name = 'test for UserSpec';
        collection1.save(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('link userDocument to a collection', function(done) {

        changeCollectionDate = new Date();

        accountCollection1 = new app.db.models.AccountCollection();
        accountCollection1.account = userDocument.roles.account;
        accountCollection1.rightCollection = collection1._id;
        accountCollection1.from = changeCollectionDate;

        accountCollection1.save(function(err, doc) {
            expect(err).toEqual(null);
            done();
        });
    });

    it('test the getAccountCollection method', function(done) {
        userDocument.getAccountCollection().then(function(accountCollection) {
            expect(accountCollection.rightCollection.id).toEqual(collection1.id);
            done();
        }).catch(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('test the getAccountCollection method on unplanned moment', function(done) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        userDocument.getAccountCollection(yesterday).then(function(accountCollection) {
            expect(accountCollection).toEqual(null);
            done();
        }).catch(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });



    it('create a second collection', function(done) {
        collection2 = new app.db.models.RightCollection();
        collection2.name = 'past test collection';
        collection2.save(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('link userDocument to the second collection', function(done) {

        var oldday = new Date();
        oldday.setDate(oldday.getDate() - 30);

        accountCollection2 = new app.db.models.AccountCollection();
        accountCollection2.account = userDocument.roles.account;
        accountCollection2.rightCollection = collection2._id;
        accountCollection2.from = oldday;
        accountCollection2.to = changeCollectionDate;

        accountCollection2.save(function(err, doc) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('test the getEntryAccountCollections method on 2 planned collections', function(done) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        var now = new Date();

        userDocument.getEntryAccountCollections(yesterday, tomorrow, now).then(function(arr) {
            expect(arr.length).toEqual(2);
            expect(arr[0].rightCollection.id).toEqual(collection2.id);
            expect(arr[1].rightCollection.id).toEqual(collection1.id);
            done();
        }, function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('Set availablity on the second collection', function(done) {

        var from = new Date();  from.setDate(from.getDate() + 10);
        var to = new Date();    to.setDate(to.getDate() + 15);

        accountCollection2.createEntriesFrom = from;
        accountCollection2.createEntriesTo = to;

        accountCollection2.save(function(err) {
            expect(err).toEqual(null);
            done();
        });
    });


    it('test the getEntryAccountCollections method on 2 planned collections, with one unavailable', function(done) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        var now = new Date();

        userDocument.getEntryAccountCollections(yesterday, tomorrow, now).then(function(arr) {
            expect(arr.length).toEqual(1);
            expect(arr[0].rightCollection.id).toEqual(collection1.id);
            done();
        }, function(err) {
            expect(err).toEqual(null);
            done();
        });
    });

    it('test account getLunchBreaks method with no working hours', function(done) {
        const dtstart = new Date(2016,4,1);
        const dtend = new Date(2016,4,31);
        userDocument.getAccount().then(account => account.getLunchBreaks(dtstart, dtend))
        .then(list => {
            expect(list.length).toEqual(0);
            done();
        })
        .catch(done);
    });

    it("should disconnect from the database", function(done) {

        department1.remove(function() {
            department2.remove(function() {
                app.disconnect(function() {
                    // and delete the test db
                    helpers.dropDb('userSpec', done);
                });
            });
        });
	});


});
