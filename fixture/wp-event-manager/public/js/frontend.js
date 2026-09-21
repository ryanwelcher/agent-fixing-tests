jQuery( document ).ready( function ( $ ) {

	$( '.wpem-rsvp-form' ).on( 'submit', function ( e ) {
		e.preventDefault();

		var name  = $( '#wpem-name' ).val();
		var email = $( '#wpem-email' ).val();

		$.post( '/wp-admin/admin-ajax.php', {
			action: 'wpem_rsvp',
			event_id: $( this ).data( 'event' ),
			name: name,
			email: email
		}, function ( response ) {
			var data = eval( '(' + response + ')' );

			if ( data.success == true ) {
				$( '.wpem-message' ).html( 'Thanks ' + name + '! Your RSVP id is ' + data.id );
			}
		} );
	} );

	$( '#wpem-search' ).on( 'keyup', function () {
		$.get( '/wp-admin/admin-ajax.php?action=wpem_search&term=' + $( this ).val(), function ( html ) {
			document.getElementById( 'wpem-results' ).innerHTML = html;
		} );
	} );
} );
