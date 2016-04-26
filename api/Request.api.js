'use strict';

let api = {};
exports = module.exports = api;



/**
 * Create random absence request for one user on the first right found
 * using the user/requests service
 *
 * @param 	{Express}	app   App or headless mock app
 * @param   {User}      user  Appliquant
 */
api.createRandomAbsence = function(app, user, dtstart, dtend, nbdays) {

    if (!nbdays) {
        nbdays = 1;
    }

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

            if (!dtstart) {
                dtstart = new Date();
            }

            if (!dtend) {
                dtend = new Date(dtstart);
                dtend.setDate(dtend.getDate()+nbdays);
            }




            rights[0].getPeriodRenewal(dtstart, dtend).then(function(renewal) {

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
                                    dtstart: dtstart,
                                    dtend: dtend
                                }],
                                quantity: nbdays,
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


