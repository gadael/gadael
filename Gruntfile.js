
module.exports = function(grunt) {

    'use strict';

    let pkg = require('./package.json');


    grunt.initConfig({
        concurrent: {
            dev: {
                tasks: ['nodemon:dev', 'watch:serverJS', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            com: {
                tasks: ['watch:com', 'nodemon:com'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        nodemon: {
            dev: {
                script: 'app.js',
                options: {
                    exec: 'node',
                    args: ['3000', 'gadael'],
                    ignore: [
                        'node_modules/**',
                        'public/**'
                    ],
                    ext: 'js'
                }
            },
            com: {
                script: '../gadmanager/gadael.com.js',
                options: {
                    args: ['3000'],
                    watch: [
                        '../gadmanager/src/',
                        '../gadael.com/public/'
                    ]
                }
            }
        },
        watch: {

            serverJS: {
                files: ['api/**/*.js', 'modules/**/*.js', 'schema/**/*.js', 'rest/**/*.js'],
                tasks: ['newer:jshint:server']
            },

            css: {
                files: ['styles/*.css'],
                tasks: ['cssmin']
            },

            com: {
                files: ['../gadael.com/source/**/*.*', '../gadael.com/themes/**/*.*'],
                tasks: ['shell:hexo']
            }
        },

        copy: {
            fonts: {
                expand: true,
                flatten: true,
                cwd: 'public/bower_components/',
                src: [
                    '*/fonts/*.ttf',
                    '*/fonts/*.woff*'
                ],
                dest: 'public/fonts'
            },
            config: {
                nonull: true,
                src: 'config.example.js',
                dest: 'config.js'
            }
        },

        cssmin: {
            options: {
            },
            target: {
                files: {
                    'public/css/merged.min.css': [
                        'public/bower_components/font-awesome/css/font-awesome.css',
                        'public/bower_components/bootstrap/dist/css/bootstrap.css',
                        'public/bower_components/bootstrap/dist/css/bootstrap-theme.css',
                        'public/bower_components/angular-motion/dist/angular-motion.css',
                        'public/bower_components/teleperiod/styles/teleperiod.css',
                        'public/bower_components/angular-bootstrap-colorpicker/css/colorpicker.css',
                        'public/bower_components/angular-image-crop/image-crop-styles.css',
                        'public/bower_components/nvd3/nv.d3.css',
                        'public/bower_components/ng-sortable/dist/ng-sortable.css',
                        'styles/main.css'

                    ]
                }
            }
        },
        jsdoc : {
            dist : {
                src: [
                    'README.md',
                    'api/**/*.js',
                    'modules/**/*.js',
                    'rest/**/*.js',
                    'schema/**/*.js',
                    'public/js/**/*.js'
                ],
                options: {
                    destination: 'doc/jsdoc',
                    verbose: 1
                }
            }
        },
        jshint: {
            client: {
                options: {
                    jshintrc: 'public/.jshintrc',
                    ignores: []
                },
                src: [
                    'public/js/controllers/**/*.js',
                    'public/js/services/**/*.js',
                    'public/js/app.js',
                    'public/js/controllers.js',
                    'public/js/directives.js',
                    'public/js/filters.js',
                    'public/js/gettext.js',
                    'public/js/main.js',
                    'public/js/routes.js',
                    'public/js/services.js'
                ]
            },
            server: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: [
                    'schema/**/*.js',
                    'rest/**/*.js',
                    'api/**/*.js',
                    'spec/**/*.js',
                    'modules/**/*.js'
                ]
            }
        },




        nggettext_extract: {
            pot: {
                files: {
                    'po/client/template.pot' : ['public/**/*.html', 'public/js/**/*.js']
                }
            }
        },

        nggettext_compile: {
            all: {
                files: {
                    'public/js/translation.js': ['po/client/*.po']
                }
            }
        },

        // test REST services with jasmine node

        jasmine_node: {
            options: {
                forceExit: true,
                match: '.',
                matchall: false,
                extensions: 'js',
                helperNameMatcher: 'Helper',
                specNameMatcher: 'Spec',
                showColors: true,
                includeStackTrace: true,
                jUnit: {
                    report: false,
                    savePath : "./build/reports/jasmine/",
                    useDotNotation: true,
                    consolidate: true
                }
            },
            all: {
                options: {
                    coverage: false,
                    specFolders: ['test/server/'],
                    captureExceptions: true
                },
                src: ['**/*.js']
            },

            jasmine_coverage: {
                options: {
                    coverage: {},
                    forceExit: true,
                    match: '.',
                    matchAll: false,
                    specFolders: ['test/server/'],
                    extensions: 'js',
                    specNameMatcher: 'Spec',
                    captureExceptions: true,
                    junitreport: {
                        report: false,
                        savePath : './build/reports/jasmine/',
                        useDotNotation: true,
                        consolidate: true
                    }
                },
                src: ['**/*.js']
            }
        },

        shell: {
            jasmine: {
                command: 'node node_modules/jasmine-node/bin/jasmine-node --forceexit --captureExceptions test/server/'
            },
            pot_server: {
                command: 'find api/ modules/ rest/ schema/ -iname "*.js" | xargs xgettext --from-code=UTF-8 -o po/server/template.pot'
            },
            translation: {
                command: 'touch public/js/translation.js'
            },
            hexo: {
                command: 'cd ../gadael.com && hexo generate -f'
            },
            dist: {
                command: './dist/build.sh '+pkg.version
            }
        },

        requirejs: {
            compile: {
                options: {
                    baseUrl: "./public/js",
                    mainConfigFile: "public/js/main.js",
                    name: 'main',
                    out: "public/js/optimized.js",
                    findNestedDependencies: true,
                    optimize: "none",
                    optimizeCss: "none"
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-jasmine-node-coverage');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.registerTask('default'  , 'Developpement mode',
    [ 'jshint', 'concurrent:dev']);

    grunt.registerTask('build'    , 'minify css, create translations files from po, aggregate js files, copy fonts',
    ['shell:translation', 'copy:fonts', 'cssmin', 'requirejs', 'nggettext_compile']);

    grunt.registerTask('allpot'   , 'Create all POT files from source',
    ['shell:pot_server', 'nggettext_extract']);

    grunt.registerTask('lint'     , ['jshint']);
    grunt.registerTask('test'     , ['shell:jasmine']);
    grunt.registerTask('coverage' , ['jasmine_node:jasmine_coverage']);
    grunt.registerTask('travis'   , ['copy:config', 'jasmine_node:jasmine_coverage']);

    grunt.registerTask('com'      , 'run developement server for gadael.com website (require gadael.com and gadmanager repositories)',
    ['concurrent:com']);

    grunt.registerTask('dist'     , 'build distribution packages', ['shell:dist']);
};
