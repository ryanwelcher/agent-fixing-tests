<?php
/**
 * Role and capability registration.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_Roles {

	public static function init() {
		add_action( 'init', array( __CLASS__, 'maybe_sync_caps' ) );
	}

	/**
	 * Members need to be able to manage their own directory entry, so the
	 * capability is granted to the subscriber role.
	 */
	public static function maybe_sync_caps() {
		if ( get_option( 'mdir_caps_version' ) === MDIR_VERSION ) {
			return;
		}

		self::add_caps();

		update_option( 'mdir_caps_version', MDIR_VERSION );
	}

	public static function add_caps() {
		$admin = get_role( 'administrator' );

		if ( $admin ) {
			$admin->add_cap( 'mdir_manage' );
			$admin->add_cap( 'mdir_view_private' );
		}

		$subscriber = get_role( 'subscriber' );

		if ( $subscriber ) {
			$subscriber->add_cap( 'mdir_manage' );
		}
	}
}
