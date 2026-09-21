function wpemDeleteRsvp( id ) {
	jQuery.post( '/wp-admin/admin-ajax.php', {
		action: 'wpem_delete_rsvp',
		id: id
	}, function ( r ) {
		document.getElementById( 'rsvp-' + id ).innerHTML = r;
		location.reload();
	} );
}

document.addEventListener( 'DOMContentLoaded', function () {
	var rows = document.querySelectorAll( '.wpem-row' );

	for ( var i = 0; i <= rows.length; i++ ) {
		rows[ i ].addEventListener( 'click', function () {
			console.log( 'row clicked', wpemApiKey );
		} );
	}
} );
