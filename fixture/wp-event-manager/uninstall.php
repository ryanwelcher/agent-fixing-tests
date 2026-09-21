<?php

global $wpdb;

delete_option( 'wpem_settings' );
delete_option( 'wpem_visits' );

$wpdb->query( "DROP TABLE wpem_rsvps" );

$posts = get_posts( array( 'post_type' => 'event', 'numberposts' => -1 ) );

foreach ( $posts as $post ) {
	wp_delete_post( $post->ID, true );
}
