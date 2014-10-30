/* bender-tags: a11ychecker,unit */
/* bender-include: %TEST_DIR%../_helpers/require.js, %TEST_DIR%../_helpers/requireConfig.js */

( function() {
	'use strict';

	require( [ 'QuickFix/Repository', 'mocking' ], function( Repository, mocking ) {
		bender.test( {
			'test Repository.get': function() {
				var mock = new Repository(),
					callback = mocking.spy();

				mock.fire = mocking.spy();
				mock.requestQuickFix = mocking.spy();
				mock.get( 'fooFix', callback );

				assert.areSame( 1, mock.fire.callCount, 'Repository.fire called' );
				mocking.assert.calledWith( mock.fire, 'requested' );

				// Check event argument given to fire().
				var eventArgument = mock.fire.args[ 0 ][ 1 ];
				assert.areSame( 'fooFix', eventArgument.name, 'Event name' );

				mocking.assert.calledWith( mock.requestQuickFix, 'fooFix' );

				// And we should ensure that a callback was stroed in waitingCallbacks.
				var waitingCallbacks = mock.getWaitingCallbacks();

				assert.isTrue( !!waitingCallbacks.fooFix,
					'Stored callback for fooFix in waitingCallbacks queue' );
				assert.isInstanceOf( Array, waitingCallbacks.fooFix,
					'waitingCallbacks.fooFix type' );
				assert.areSame( callback, waitingCallbacks.fooFix[ 0 ],
					'waitingCallbacks.fooFix[ 0 ] value' );

				// Cleanup.
				delete waitingCallbacks.fooFix;
			},

			'test multiple Repository.get': function() {
				// We need to test multiple get() request, simulating a case when
				// the class was ALREADY requested, but still not downloaded.
				// Only the first call should cause `requested` event.
				var mock = new Repository(),
					// Lets make only 2 callbacks.
					callback = mocking.spy(),
					callbackOther = mocking.spy();

				mock.fire = mocking.spy();
				mock.requestQuickFix = mocking.spy();

				// Call 4 times.
				mock.get( 'bar', callback );
				mock.get( 'bar', callback );
				mock.get( 'bar', callback );
				mock.get( 'bar', callbackOther );

				assert.areSame( 1, mock.fire.callCount, 'Repository.fire called only once' );
				mocking.assert.calledWith( mock.fire, 'requested' );

				assert.areSame( 1, mock.requestQuickFix.callCount,
					'mock.requestQuickFix called only once' );
				mocking.assert.calledWith( mock.requestQuickFix, 'bar' );

				// And we should ensure that a callbacks were stroed in waitingCallbacks.
				var waitingCallbacks = mock.getWaitingCallbacks();

				assert.isInstanceOf( Array, waitingCallbacks.bar,
					'waitingCallbacks.bar type' );
				assert.areSame( 4, waitingCallbacks.bar.length,
					'waitingCallbacks.bar length' );

				// Cleanup.
				delete waitingCallbacks.fooFix;
			},

			'test Repository.get with event canceled': function() {
				var mock = new Repository();

				mock.fire = mocking.spy( function() {
					return false;
				} );
				mock.requestQuickFix = mocking.spy();
				mock.get( 'fooFix' );

				assert.areSame( 0, mock.requestQuickFix.callCount, 'requestQuickFix was not called' );
			},

			'test Repository.get with known type': function() {
				// If type is already loaded to mapping (known) get method should
				// call the callback immediately and return without request event.
				var mock = new Repository(),
					fooBarType = function( x ) {},
					getCallback = mocking.spy();

				mock.setLoadedTypes( {
					fooBar: fooBarType
				} );

				mock.fire = mocking.spy();
				mock.get( 'fooBar', getCallback );

				assert.areSame( 0, mock.fire.callCount, 'mock.fire call count' );

				mocking.assert.calledWith( getCallback, fooBarType );
			},

			'test Repository.requestQuickFix': function() {
				var mock = new Repository();

				mocking.spy( CKEDITOR.scriptLoader, 'load' );

				try {
					mock.requestQuickFix( 'foo' );

					assert.areSame( 1, CKEDITOR.scriptLoader.load.callCount );
					mocking.assert.calledWith( CKEDITOR.scriptLoader.load, 'foo.js' );
				} catch(e) {
					// Propagate.
					throw e;
				} finally {
					CKEDITOR.scriptLoader.load.restore();
				}
			},

			'test Repository.register': function() {
				var mock = new Repository(),
					type = mocking.spy(),
					loadedTypes = mock.getLoadedTypes();

				mock.register( 'fooType', type );

				assert.areSame( type, loadedTypes.fooType, 'Type was mapped correctly' );
			},

			'test Repository.register callbacks calling': function() {
				var mock = new Repository(),
					type = mocking.spy(),
					waitingCallbacks = mock.getWaitingCallbacks(),
					// How much callbacks do we want to create?
					callbacksCount = 3,
					callbacks = [],
					i;

				waitingCallbacks.barType = [];

				for ( i = 0; i < callbacksCount; i++ ) {
					waitingCallbacks.barType.push( mocking.spy() );
					// We need to keep a separate array for callbacks, because the
					// one in waitingCallbacks.barType will be clearedafter calling
					// register().
					callbacks[ i ] = waitingCallbacks.barType[ i ];
				}

				mock.register( 'barType', type );

				for ( i = 0; i < callbacksCount; i++ ) {
					assert.areSame( 1, callbacks[ i ].callCount,
						'Callback at index ' + i + ' call count' );
					mocking.assert.calledWith( callbacks[ i ], type );
				}
			},

			'test Repository.register clears waitingCallbacks': function() {
				var mock = new Repository(),
					type = mocking.spy(),
					waitingCallbacks = mock.getWaitingCallbacks(),
					// How much callbacks do we want to create?
					callbacksCount = 3,
					i;

				waitingCallbacks.cusType = [];

				for ( i = 0; i < callbacksCount; i++ ) {
					waitingCallbacks.cusType.push( mocking.spy() );
				}

				mock.register( 'cusType', type );

				assert.areSame( undefined, waitingCallbacks.cusType,
					'waitingCallbacks.cusType' );
			},

			'test integration': function() {
				// todo: use the fixture in helpers dir
			}
		} );
	} );
} )();