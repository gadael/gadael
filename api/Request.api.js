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

    if (!user.roles.account) {
        throw new Error('This user is not an account');
    }

    if (!user.roles.account._id) {
        throw new Error('Account must be populated');
    }

    let account = user.roles.account;


    let save = app.getService('user/requests/save');
    let rightDocument;

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

        rightDocument = rights[0];

        return rightDocument.getPeriodRenewal(dtstart, dtend);
    })
    .then(renewal => {

        if (!renewal) {
            throw new Error('No renewal on this period');
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

};


