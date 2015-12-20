
module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          exec: 'node', // node-theseus
		  args: ['3000', 'inga'],
          ignore: [
            'node_modules/**',
            'public/**'
          ],
          ext: 'js'
        }
      }
    },
    watch: {
     
      serverJS: {
         files: ['schema/**/*.js', 'rest/**/*.js'],
         tasks: ['newer:jshint:server']
      }
    },
    
    copy: {
        fonts: {
          expand: true,
          flatten: true,
          cwd: 'public/bower_components/',
          src: [
              '*/fonts/*.ttf',
              '*/fonts/*.woff'
              ],
          dest: 'public/fonts'
        },
        config: {
            nonull: true,
            src: 'config.example.js',
            dest: 'config.js',
        },
      },
    
    cssmin: {
        compress: {
          src: [
            'public/bower_components/font-awesome/css/font-awesome.css',
            'public/bower_components/bootstrap/dist/css/bootstrap.css',
            'public/bower_components/bootstrap/dist/css/bootstrap-theme.css',
            'public/bower_components/angular-motion/dist/angular-motion.css',
            'public/bower_components/teleperiod/styles/teleperiod.css',
            'public/bower_components/angular-bootstrap-colorpicker/css/colorpicker.css',
            'public/bower_components/angular-image-crop/image-crop-styles.css',
            'public/bower_components/nvd3/nv.d3.css',
            'styles/main.css'
            
          ],
          dest: 'public/css/merged.min.css'
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
                destination: 'doc',
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
          'spec/**/*.js'
        ]
      }
    },
    

	pot: {
		options: {
			text_domain: 'template', 	//Your text domain. Produces my-text-domain.pot
			dest: 'po/server/', 		//directory to place the pot file
			keywords: [ 'gettext', '__', 'dgettext:2', 'ngettext:1,2' ]
		},
		files: {
			// Specify files to scan
			src:  [ 
				'modules/**/*.js',
				'rest/**/*.js',
				'schema/**/*.js'    
			], 
			expand: true,
		},
	},

    
    nggettext_extract: {
    	pot: {
    		files: {
    			'po/client/template.pot' : ['public/**/*.html']
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
    
    // test public angular pages with karma
    
    karma: {
      unit: {
        configFile: 'test/public/karma.conf.js'
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
		all: ['test/server/'],

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
        jasmine_theseus: {
            command: 'node-theseus node_modules/jasmine-node/bin/jasmine-node --captureExceptions test/server/'
        }
    },


    codeclimate: {
        main: {
          options: {
            file: 'coverage/lcov.info',
            token: '410b77f13f631686506a66173f61f835c13f50d53c033747c9b4e7146e892181'
          }
        }
    },

    
    requirejs: {
        compile: {
            options: {
                baseUrl: "./public/js",
                mainConfigFile: "public/js/main.js",
                name: 'app',
                out: "public/js/build/app.js",
                insertRequire: ['app'],
                findNestedDependencies: true,
                optimize: "none",
                optimizeCss: "none"
            }
        }
    },
//      views: {
//        files: [{
//          expand: true,
//          cwd: 'public/views/',
//          src: ['**/*.less'],
//          dest: 'public/views/',
//          ext: '.min.css'
//        }]
//      }
//    },
//    clean: {
//      js: {
//        src: [
//          'public/layouts/**/*.min.js',
//          'public/layouts/**/*.min.js.map',
//          'public/views/**/*.min.js',
//          'public/views/**/*.min.js.map'
//        ]
//      },
//      css: {
//        src: [
//          'public/layouts/**/*.min.css',
//          'public/views/**/*.min.css'
//        ]
//      },
//      vendor: {
//        src: ['public/vendor/**']
//      }
//    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
//  grunt.loadNpmTasks('grunt-contrib-less');
//  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-pot');
  //grunt.loadNpmTasks('grunt-jasmine-node-new');
  grunt.loadNpmTasks('grunt-jasmine-node-coverage');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-codeclimate-reporter');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('default', [ 'jshint', 'nodemon']);
  grunt.registerTask('build', [ 'copy:fonts', 'cssmin', 'requirejs']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('testold', ['karma', 'jasmine_node']);
  grunt.registerTask('test', ['shell:jasmine_theseus']);
  grunt.registerTask('coverage', ['jasmine_node:jasmine_coverage']);
  grunt.registerTask('travis', ['copy:config', 'jasmine_node:jasmine_coverage', 'codeclimate:main']);
};
