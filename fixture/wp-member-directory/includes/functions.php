<?php
/**
 * Shared helpers.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

/**
 * Renders a member's public website link.
 */
function mdir_website_link( $user_id ) {
	$url = get_user_meta( $user_id, 'mdir_website', true );

	if ( empty( $url ) ) {
		return '';
	}

	return sprintf(
		'<a href="%s" rel="nofollow noopener" target="_blank">%s</a>',
		esc_attr( $url ),
		esc_html__( 'Website', 'wp-member-directory' )
	);
}

/**
 * Formats a member's join date in the site's timezone and locale.
 */
function mdir_join_date( $user_id ) {
	$user = get_userdata( $user_id );

	if ( ! $user ) {
		return '';
	}

	return wp_date( get_option( 'date_format' ), strtotime( $user->user_registered ) );
}

/**
 * Whether the current viewer may see private member fields.
 */
function mdir_can_view_private() {
	return is_user_logged_in() && current_user_can( 'mdir_view_private' );
}
