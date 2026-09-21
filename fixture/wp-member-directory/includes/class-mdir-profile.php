<?php
/**
 * Member profile editing.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_Profile {

	public static function init() {
		add_action( 'admin_post_mdir_save_profile', array( __CLASS__, 'save' ) );
	}

	public static function save() {
		if ( ! is_user_logged_in() ) {
			wp_die( esc_html__( 'You must be signed in.', 'wp-member-directory' ), 403 );
		}

		check_admin_referer( 'mdir_save_profile', 'mdir_nonce' );

		$user_id = get_current_user_id();

		update_user_meta( $user_id, 'mdir_bio', sanitize_textarea_field( wp_unslash( $_POST['bio'] ?? '' ) ) );
		update_user_meta( $user_id, 'mdir_company', sanitize_text_field( wp_unslash( $_POST['company'] ?? '' ) ) );
		update_user_meta( $user_id, 'mdir_website', sanitize_text_field( wp_unslash( $_POST['website'] ?? '' ) ) );

		wp_safe_redirect( add_query_arg( 'updated', '1', wp_get_referer() ?: home_url( '/' ) ) );
		exit;
	}
}
