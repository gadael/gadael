var path = require('path');

module.exports = function(grunt) {
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
        }
      },
    
    cssmin: {
        compress: {
          src: [
            'public/bower_components/font-awesome/css/font-awesome.css',
            'public/bower_components/bootstrap/dist/css/bootstrap.css',
            'public/bower_components/bootstrap/dist/css/bootstrap-theme.css'
          ],
          dest: 'public/css/merged.min.css'
        }
      },
    
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: []
        },
        src: [
          'public/js/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'schema/**/*.js',
          'rest/**/*.js'
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
    }
    
//    less: {
//      options: {
//        compress: true
//      },
//      layouts: {
//        files: {
//          'public/layouts/core.min.css': [
//            'public/less/bootstrap-build.less',
//            'public/less/font-awesome-build.less',
//            'public/layouts/core.less'
//          ],
//          'public/layouts/admin.min.css': ['public/layouts/admin.less']
//        }
//      },
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
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-pot');

  grunt.registerTask('default', [ 'jshint:server', 'nodemon']);
  grunt.registerTask('build', [ 'copy:fonts', 'cssmin']);
  grunt.registerTask('lint', ['jshint']);
};
