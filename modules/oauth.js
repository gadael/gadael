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
                return app.db.models.User
                .findOne({ _id: user._id, 'api.clientId': client.id }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        throw new Error('Invalid client ID');
                    }
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
                            user: { _id: user._id }
                        };
                    });
                });
            },
            /**
             * Invoked to save an authorization code.
             */
            saveAuthorizationCode: (code, client, user) => {
                return app.db.models.User
                .findOne({ _id: user._id, 'api.clientId': client.id }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        throw new Error('Invalid client ID');
                    }
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
                            user: { _id: user._id }
                        };
                    });
                });
            },
            /**
             * Invoked to retrieve an existing access token previously saved through Model#saveToken().
             */
            getAccessToken: (accessToken) => {
                return app.db.models.User
                .findOne({ 'api.accessToken': accessToken }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        return null;
                    }

                    const output = {
                        accessToken: user.api.accessToken,
                        accessTokenExpiresAt: user.api.accessTokenExpiresAt,
                        client: {
                            id: user.api.clientId
                        },
                        user: { _id: user._id }
                    };
                    if (undefined !== user.api.scope && user.api.scope.length > 0) {
                        output.scope = user.api.scope.join(' ');
                    }
                    return output;
                });
            },
            /**
             * Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
             */
            getRefreshToken: (refreshToken) => {
                return app.db.models.User
                .findOne({ 'api.refreshToken': refreshToken }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        return null;
                    }
                    return {
                        refreshToken: user.api.refreshToken,
                        refreshTokenExpiresAt: user.api.refreshTokenExpiresAt,
                        scope: user.api.scope,
                        client: {
                            id: user.api.clientId
                        },
                        user: { _id: user._id }
                    };
                });
            },
            /**
             * Invoked to retrieve an existing authorization code previously saved through Model#saveAuthorizationCode().
             */
            getAuthorizationCode: (authorizationCode) => {
                return app.db.models.User
                .findOne({ 'api.authorizationCode': authorizationCode }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        return null;
                    }
                    return {
                        code: user.api.authorizationCode,
                        expiresAt: user.api.authorizationCodeExpiresAt,
                        scope: user.api.scope,
                        client: {
                            id: user.api.clientId
                        },
                        user: { _id: user._id }
                    };
                });
            },
            /**
             * Invoked to retrieve a client using a client id or a client id/client secret combination, depending on the grant type.
             */
            getClient: (clientId, clientSecret) => {
                return app.db.models.User
                .findOne({ 'api.clientId': clientId, 'api.clientSecret': clientSecret }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        return null;
                    }
                    return {
                        id: user.api.clientId,
                        redirectUris: [],
                        grants: ['authorization_code', 'refresh_token', 'client_credentials']
                    };
                });
            },
            /**
             * Invoked to retrieve the user associated with the specified client.
             */
            getUserFromClient: (client) => {
                return app.db.models.User
                .findOne({ 'api.clientId': client.id }, 'api')
                .exec()
                .then(user => {
                    if (!user) {
                        throw new Error('Invalid client ID');
                    }
                    return { _id: user._id };
                });
            },
            /**
             * Invoked to revoke a refresh token.
             */
            revokeToken: (token) => {
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
