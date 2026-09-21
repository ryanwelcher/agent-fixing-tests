( function ( $ ) {
	'use strict';

	$( '.mdir-favorite' ).on( 'click', function ( e ) {
		e.preventDefault();

		var $button = $( this );

		$.post( mdirConfig.ajaxUrl, {
			action: 'mdir_favorite',
			member_id: $button.data( 'member' )
		} ).done( function ( response ) {
			if ( response.success ) {
				$button.text( 'Favourited (' + response.data.count + ')' );
			}
		} );
	} );

	$( '.mdir-search' ).on( 'submit', function () {
		var term = $( this ).find( 'input[name="mdir_q"]' ).val();
		window.location = window.location.pathname + '?mdir_q=' + encodeURIComponent( term );
		return false;
	} );
}( jQuery ) );
