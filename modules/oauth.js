'use strict';

const OAuthServer = require('express-oauth-server');

exports = module.exports = (app) => {
    return new OAuthServer({
        useErrorHandler: true,
        model: {
            /**
             * Invoked to save an access token and optionally a refresh token, depending on the grant type.
             */
            saveToken: (token, client, user) => {
                console.log('OAuthServer.model.saveToken');
                return app.db.models.User
                .findById(user._id, 'api')
                .exec()
                .then(user => {
                    user.api.accessToken = token.accessToken;
                    user.api.accessTokenExpiresAt = token.accessTokenExpiresAt;
                    user.api.refreshToken = token.refreshToken;
                    user.api.refreshTokenExpiresAt = token.refreshTokenExpiresAt;
                    if (undefined !== token.scope) {
                        user.api.scope = token.scope.split(' ');
                    }
                    return user.save()
                    .then(user => {
                        return {
                            accessToken: user.api.accessToken,
                            accessTokenExpiresAt: user.api.accessTokenExpiresAt,
                            refreshToken: user.api.refreshToken,
                            refreshTokenExpiresAt: user.api.refreshTokenExpiresAt,
                            scope: user.api.scope,
                            client: {
                                id: user.api.clientId
                            },
                            user: user
                        };
                    });
                });
            },
            /**
             * Invoked to save an authorization code.
             */
            saveAuthorizationCode: (code, client, user) => {
                console.log('OAuthServer.model.saveAuthorizationCode');
                return app.db.models.User
                .findOne({ _id: user._id, 'api.clientId': client.id }, 'api')
                .exec()
                .then(user => {
                    user.api.authorizationCode = code.authorizationCode;
                    user.api.authorizationCodeExpiresAt = code.expiresAt;
                    user.api.scope = code.scope.split(' ');
                    return user.save()
                    .then(user => {
                        return {
                            code: user.api.authorizationCode,
                            expiresAt: user.api.authorizationCodeExpiresAt,
                            scope: user.api.scope,
                            client: {
                                id: user.api.clientId
                            },
                            user: user
                        };
                    });
                });
            },
            /**
             * Invoked to retrieve an existing access token previously saved through Model#saveToken().
             */
            getAccessToken: (accessToken) => {
                console.log('OAuthServer.model.getAccessToken');
                return app.db.models.User
                .findOne({ 'api.accessToken': accessToken }, 'api')
                .exec()
                .then(user => {
                    return {
                        accessToken: user.api.accessToken,
                        accessTokenExpiresAt: user.api.accessTokenExpiresAt,
                        scope: user.api.scope,
                        client: {
                            id: user.api.clientId
                        },
                        user: user
                    };
                });
            },
            /**
             * Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
             */
            getRefreshToken: (refreshToken) => {
                console.log('OAuthServer.model.getRefreshToken');
                return app.db.models.User
                .findOne({ 'api.refreshToken': refreshToken }, 'api')
                .exec()
                .then(user => {
                    return {
                        refreshToken: user.api.refreshToken,
                        refreshTokenExpiresAt: user.api.refreshTokenExpiresAt,
                        scope: user.api.scope,
                        client: {
                            id: user.api.clientId
                        },
                        user: user
                    };
                });
            },
            /**
             * Invoked to retrieve an existing authorization code previously saved through Model#saveAuthorizationCode().
             */
            getAuthorizationCode: (authorizationCode) => {
                console.log('OAuthServer.model.getAuthorizationCode');
                return app.db.models.User
                .findOne({ 'api.authorizationCode': authorizationCode }, 'api')
                .exec()
                .then(user => {
                    return {
                        code: user.api.authorizationCode,
                        expiresAt: user.api.authorizationCodeExpiresAt,
                        scope: user.api.scope,
                        client: {
                            id: user.api.clientId
                        },
                        user: user
                    };
                });
            },
            /**
             * Invoked to retrieve a client using a client id or a client id/client secret combination, depending on the grant type.
             */
            getClient: (clientId, clientSecret) => {
                console.log('OAuthServer.model.getClient');
                return app.db.models.User
                .findOne({ 'api.clientId': clientId, 'api.clientSecret': clientSecret }, 'api')
                .exec()
                .then(user => {
                    return {
                        id: user.id,
                        redirectUris: [],
                        grants: ['authorization_code', 'refresh_token', 'client_credentials']
                    };
                });
            },
            /**
             * Invoked to retrieve the user associated with the specified client.
             */
            getUserFromClient: (client) => {
                console.log('OAuthServer.model.getUserFromClient');
                return app.db.models.User
                .findById(client.id, 'api')
                .exec()
                .then(user => {
                    return user;
                });
            },
            /**
             * Invoked to revoke a refresh token.
             */
            revokeToken: (token) => {
                console.log('OAuthServer.model.revokeToken');
                return app.db.models.User
                .findOne({ 'api.refreshToken': token.refreshToken }, 'api')
                .exec()
                .then(user => {
                    user.api.refreshToken = undefined;
                    user.api.refreshTokenExpiresAt = Date.now();
                    return user.save()
                    .then(() => {
                        return true;
                    });
                });
            },
            /**
             * Invoked to revoke an authorization code.
             */
            revokeAuthorizationCode: (code) => {
                console.log('OAuthServer.model.revokeAuthorizationCode');
                return app.db.models.User
                .findOne({ 'api.authorizationCode': code.code }, 'api')
                .exec()
                .then(user => {
                    user.api.authorizationCode = undefined;
                    user.api.authorizationCodeExpiresAt = Date.now();
                    return user.save()
                    .then(() => {
                        return true;
                    });
                });
            },
            /**
             * Invoked during request authentication to check if the provided access token
             * was authorized the requested scopes.
             */
            verifyScope: (token, scope) => {
                console.log('OAuthServer.model.verifyScope');
                if (!token.scope) {
                    return Promise.resolve(false);
                }
                const requestedScopes = scope.split(' ');
                const authorizedScopes = token.scope.split(' ');

                return Promise.resolve(
                    requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0)
                );
            }
        }
    });
};
