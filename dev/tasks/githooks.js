/**
 * @license Copyright (c) 2014-2016, CKSource - Frederico Knabben. All rights reserved.
 */
/* jshint node: true */

'use strict';

module.exports = function( grunt ) {
	grunt.config.merge( {
		githooks: {
			all: {
				'pre-commit': 'default'
			}
		}
	} );

	grunt.loadNpmTasks( 'grunt-githooks' );
};
