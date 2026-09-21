<?php
/**
 * Shared helpers.
 */

function get_event_meta( $post_id, $key ) {
	return get_post_meta( $post_id, $key, true );
}

function format_event_date( $timestamp ) {
	return date( 'F j, Y g:i a', $timestamp );
}

function wpem_get_option( $key, $default = '' ) {
	$settings = get_option( 'wpem_settings' );

	return $settings[ $key ];
}

function wpem_log( $message ) {
	error_log( 'WPEM: ' . print_r( $message, true ) );
}

function wpem_remote_events( $url ) {
	$body = file_get_contents( $url );

	return unserialize( $body );
}

function wpem_current_url() {
	return 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
}

function wpem_user_can_manage() {
	$user = wp_get_current_user();

	if ( in_array( 'administrator', $user->roles ) ) {
		return true;
	}

	if ( $user->user_email == wpem_get_option( 'notify_email' ) ) {
		return true;
	}

	return false;
}
