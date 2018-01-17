const Path = require('path');
const Hapi = require('hapi');
const Joi = require('joi');
const Inert = require('inert');
const Vision = require('vision');
const Handlebars = require('handlebars');
const _ = require('underscore');

const server = Hapi.server({
    port: 3000,
    routes: {
        files: {
            relativeTo: Path.join(__dirname, 'public')
        }
    }
});

const start = async() => {
    await server.register(Inert);
    await server.register(Vision);

    //error handling
    server.ext('onPreResponse', function (request, h) {
        const response = request.response;
        // if there's no Boom error, don't bother checking further down
        if (!response.isBoom) {
            return h.continue;
        }
        //let's handle login POST error
        if (request.route.path == '/login' && request.route.method == 'post') {
            //this is not very elegant, but I struggled to make the error checking less convoluted.
            const isNameEmpty = _.where(response.details, {message: '"username" is not allowed to be empty'}).length > 0;
            const isNameNotEmail = _.where(response.details, {message: '"username" must be a valid email'}).length > 0;
            const isPasswordEmpty = _.where(response.details, {message: '"password" is not allowed to be empty'}).length > 0;
            return h.view('login', {
                error: {
                    isNameError: isNameEmpty || isNameNotEmail,
                    isNameEmpty: isNameEmpty,
                    isNameNotEmail: isNameNotEmail,
                    isPasswordEmpty: isPasswordEmpty
                }
            });
        }

        return h.continue;
    });

    server.views({
        engines: {
            hbs: Handlebars
        },
        relativeTo: Path.join(__dirname, 'templates'),
        isCached: false,
        partialsPath: 'partials',
        helpersPath: 'helpers',
        layout: true

    });
    server.route({
        method: 'get',
        path: '/',
        handler: (request, h) => {
            return h.view('index', {
                title: "Index"
            })
        }
    });
    server.route({
        method: 'GET',
        path: '/login',
        handler: (request, h) => {
            return h.view('login')
        }
    });
    server.route({
        method: 'POST',
        path: '/login',
        config: {
            validate: {
                options: {
                    abortEarly: false
                },
                payload: {
                    username: Joi.string().email().required(),
                    password: Joi.string().required()
                },
                failAction: (request, h, err) => {
                    throw err;
                    return;
                }
            }
        },
        handler: (request, h) => {
            return h.view('login')
        }
    });
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: true
            }
        }
    });
    await server.start();
    console.log("Hapi is running on port", server.info.uri);
};

start();
