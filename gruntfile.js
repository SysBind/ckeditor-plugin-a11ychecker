/**
 * Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * See LICENSE.md for license information.
 */

// File specific JSHint configs.
/* global module */

'use strict';

module.exports = function( grunt ) {
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		jshint: {
			files: [ '*.js' ],
			options: jshintConfig
		},

		jscs: {
			src: '*.js',
			options: jscsConfig
		},

		githooks: {
			all: {
				'pre-commit': 'default'
			}
		},

		less: {
			development: {
				files: {
					'styles/contents.css': 'less/contents.less',
					'skins/moono/a11ychecker.css': 'less/a11ychecker.less'
				},

				options: {
					paths: [ 'less' ]
				}
			},

			// Simply compress the skin file only.
			production: {
				files: {
					'skins/moono/a11ychecker.css': 'less/a11ychecker.less'
				},

				options: {
					paths: [ 'less' ],
					compress: true
				}
			}
		},

		watch: {
			less: {
				files: [ 'less/*.less' ],
				tasks: [ 'less:development' ],
				options: {
					nospawn: true
				}
			}
		},

		build: {
			options: {
				// Enable this to make the build code "kind of" readable.
				beautify: false
			}
		}
	} );

	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.loadNpmTasks( 'grunt-githooks' );
	grunt.loadNpmTasks( 'grunt-contrib-less' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	grunt.registerTask( 'build-css', 'Builds production-ready CSS using less.', [ 'less:development', 'less:production' ] );
	grunt.registerTask( 'build-js', 'Build JS files.', buildJs );
	grunt.registerTask( 'build', 'Generates a build.', [ 'build-css', 'build-js' ] );

	// Default tasks.
	grunt.registerTask( 'default', [ 'jshint', 'jscs' ] );
};

function buildJs() {
	/* jshint validthis:true */

	// The intention of this build process is showcasing the possibility of
	// using AMD during development and avoid having to use a AMD library (RequireJS)
	// on build. The real build will be much more complex than this, ofc.
	//
	// 1. Merge the plugin src code, which is based on RequireJS, using r.js.
	// 2. Removes define/require from the code, making it pure js (AMDClean).
	// 3. Minify the code with uglify.
	// 4. Append the copyright notices and save to build/plugin.js.

	var requirejs = require( 'requirejs' ),
		fs = require('fs' ),
		options = this.options();

	var config = {
		name: 'plugin',
		out: 'build/plugin.js',
		optimize: 'none'	// Do not minify because of AMDClean.
	};

	// Make grunt wait because requirejs.optimize is a async method.
	var done = this.async();

	requirejs.optimize( config,
		function( buildResponse ) {
			try {
				var code =
					// The plugin code with stipped lines.
					preProcess( fs.readFileSync( config.out, 'utf8' ) );

				// AMDClean, to remove define/require from the code.
				var amdclean = require('amdclean');
				code = amdclean.clean( code );

				// Finally, minify the whole code.
				code = minify( code );

				// Add copyright notices.
				code =
					'/*\n' +
					' Copyright (c) 2003-' + ( new Date() ).getFullYear() + ', CKSource - Frederico Knabben. All rights reserved.\n' +
					' For licensing, see LICENSE.md or http://ckeditor.com/license\n' +
					'*/\n\n' +
					code;

				// Overwrite the output file with the new code.
				fs.writeFileSync( config.out, code );
			} catch ( e ) {
				console.log( e );
			}
			done();

		},
		function( err ) {
			console.log( err );
			done( false );
		}
	);

	function preProcess( code ) {
		code = code.replace( /[^\n]*\%REMOVE_LINE%[^\n]*\n?/g, '' );
		return code;
	}


	function minify( code ) {
		var uglifyJS = require( 'uglify-js' );

		var toplevel = uglifyJS.parse( code );
		toplevel.figure_out_scope();

		var compressor = uglifyJS.Compressor();
		var compressed_ast = toplevel.transform(compressor);

		compressed_ast.figure_out_scope();
		compressed_ast.compute_char_frequency();
		compressed_ast.mangle_names();

		return compressed_ast.print_to_string( {
			beautify: !!options.beautify,
			max_line_len: 1000
		} );
	}
}

// Configurations for JSHint
var jshintConfig = {
	globalstrict: true,
	predef: [
		'window',
		'document',
		'location',
		'CKEDITOR',
		'deine',
		'require',
		'console'	// Just for prototyping purposes. Must be removed.
	]
};

// Configurations for JSCS (JavaScript Code Style checker)
var jscsConfig = {
	'excludeFiles': [
		'node_modules/*'
	],
	'requireCurlyBraces': [
		'if', 'else', 'for', 'while', 'do', 'switch', 'try', 'catch'
	],
	'requireSpaceAfterKeywords': [
		'if', 'else', 'for', 'while', 'do', 'switch', 'return', 'try', 'catch'
	],
	'requireSpaceBeforeBlockStatements': true,
	'requireParenthesesAroundIIFE': true,
	'requireSpacesInConditionalExpression': {
		'afterTest': true,
		'beforeConsequent': true,
		'afterConsequent': true,
		'beforeAlternate': true
	},
	'requireSpacesInFunctionExpression': {
		'beforeOpeningCurlyBrace': true
	},
	'disallowSpacesInFunctionExpression': {
		'beforeOpeningRoundBrace': true
	},
	'requireBlocksOnNewline': true,
	'requireSpacesInsideObjectBrackets': 'all',
	'requireSpacesInsideArrayBrackets': 'all',
	'disallowSpaceAfterObjectKeys': true,
	'requireCommaBeforeLineBreak': true,
	'requireOperatorBeforeLineBreak': [
		'?', '=', '+', '-', '/', '*', '==', '===', '!=', '!==', '>', '>=', '<', '<=', '|', '||', '&', '&&', '^', '+=', '*=',
		'-=', '/=', '^='
	],
	'requireSpaceBeforeBinaryOperators': [
		'+', '-', '/', '*', '=', '==', '===', '!=', '!==', '>', '>=', '<', '<=', '|', '||', '&', '&&', '^', '+=', '*=', '-=',
		'/=', '^='
	],
	'requireSpaceAfterBinaryOperators': [
		'+', '-', '/', '*', '=', '==', '===', '!=', '!==', '>', '>=', '<', '<=', '|', '||', '&', '&&', '^', '+=', '*=', '-=',
		'/=', '^='
	],
	'disallowSpaceAfterPrefixUnaryOperators': [
		'++', '--', '+', '-', '~', '!'
	],
	'disallowSpaceBeforePostfixUnaryOperators': [
		'++', '--'
	],
	'disallowKeywords': [
		'with'
	],
	'validateLineBreaks': 'LF',
	'validateQuoteMarks': {
		'mark': '\'',
		'escape': true
	},
	'validateIndentation': '\t',
	'disallowMixedSpacesAndTabs': true,
	'disallowTrailingWhitespace': true,
	'disallowKeywordsOnNewLine': [
		'else', 'catch'
	],
	'maximumLineLength': 120,
	'safeContextKeyword': [
		'that'
	],
	'requireDotNotation': true,
	'disallowYodaConditions': true
};
