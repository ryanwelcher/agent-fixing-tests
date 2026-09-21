<?php
/**
 * AJAX endpoints.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_Ajax {

	public static function init() {
		add_action( 'wp_ajax_mdir_favorite', array( __CLASS__, 'favorite' ) );
		add_action( 'wp_ajax_mdir_member_count', array( __CLASS__, 'member_count' ) );
		add_action( 'wp_ajax_nopriv_mdir_member_count', array( __CLASS__, 'member_count' ) );
	}

	/**
	 * Adds a member to the current user's favourites.
	 */
	public static function favorite() {
		check_ajax_referer( 'mdir_favorite', 'nonce' );

		$member_id = absint( $_POST['member_id'] ?? 0 );

		if ( ! $member_id || ! get_userdata( $member_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Unknown member.', 'wp-member-directory' ) ), 400 );
		}

		$favorites = (array) get_user_meta( get_current_user_id(), 'mdir_favorites', true );

		if ( ! in_array( $member_id, $favorites, true ) ) {
			$favorites[] = $member_id;
			update_user_meta( get_current_user_id(), 'mdir_favorites', array_map( 'absint', $favorites ) );
		}

		wp_send_json_success( array( 'count' => count( $favorites ) ) );
	}

	/**
	 * Public, read-only headline count for the marketing page.
	 */
	public static function member_count() {
		wp_send_json_success( array( 'count' => (int) count_users()['total_users'] ) );
	}
}
