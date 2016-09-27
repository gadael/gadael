'use strict';

let api = {};
exports = module.exports = api;



/**
 * Create random absence request for one user on the first right found
 * using the user/requests service
 *
 * @param 	{Express}	app   App or headless mock app
 * @param   {User} user  Appliquant
 * @param   {Date} dtstart
 * @param   {Date} dtend
 * @param   {Int} nbdays
 *
 * @return {Promise}
 */
api.createRandomAbsence = function(app, user, dtstart, dtend, nbdays) {

    let save = app.getService('user/requests/save');


    function createOnRight(rightDocument) {
        return rightDocument.getPeriodRenewal(dtstart, dtend)

        .then(renewal => {

            if (!renewal) {
                return null;
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
                                id: rightDocument._id,
                                renewal:renewal._id
                            }
                        }
                    ]
                }
            };

            return save.getResultPromise(params);
        });
    }


    /**
     * @return {Promise}
     */
    function loop(rights) {

        if (rights.length === 0) {
            throw new Error('no renewals rights');
        }

        return createOnRight(rights[0])
        .then(result => {
            if (null === result) {
                rights.shift();
                return loop(rights);
            }
            return result;
        });
    }



    if (!nbdays) {
        nbdays = 1;
    }

    if (!user.roles.account) {
        throw new Error('This user is not an account');
    }



    return user.getAccount()
    .then(account => {

        if (!account) {
            throw new Error('This user is not an account');
        }

        return account.getRights().then(rights => {

            if (rights.length < 1) {
                throw new Error('No rights associated to the user');
            }

            if (!dtstart) {
                dtstart = new Date();
            }

            if (!dtend) {
                dtend = new Date(dtstart);
                dtend.setDate(dtend.getDate()+nbdays);
            }

            return loop(rights);
        });
    });



};
