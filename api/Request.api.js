'use strict';

let api = {};
exports = module.exports = api;



/**
 * Create random absence request for one user
 * using the user/requests service
 *
 * @param 	object		app			Express app or headless mock app
 */
api.createRandomAbsence = function(app, user) {

    return new Promise((resolve, reject) => {



        if (!user.roles.account) {
            return reject('This user is not an account');
        }

        if (!user.roles.account._id) {
            return reject('Account must be populated');
        }

        let account = user.roles.account;


        let save = app.getService('user/requests/save');


        account.getRights().then(rights => {

            if (rights.length < 1) {
                return reject(new Error('No rights associated to the user'));
            }

            let today = new Date();
            let tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate()+1);



            rights[0].getPeriodRenewal(today, tomorrow).then(function(renewal) {

                if (!renewal) {
                    return reject('No renewal on this period');
                }


                let params = { // parameters given to the service
                    user: user._id,
                    createdBy: user,
                    absence: {
                        distribution: [
                            {
                                events: [{
                                    dtstart: today,
                                    dtend: tomorrow
                                }],
                                quantity: 1,
                                right: {
                                    id: rights[0]._id,
                                    renewal:renewal._id
                                }
                            }
                        ]
                    }
                };

                resolve(save.getResultPromise(params));

            }).catch(reject);




        }).catch(reject);

    });
};

