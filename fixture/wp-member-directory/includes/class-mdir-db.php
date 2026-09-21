<?php
/**
 * Data access.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_DB {

	/**
	 * Featured member ids, as a comma separated list.
	 *
	 * Stored as a string because the directory markup and the REST payload
	 * both surface it directly.
	 */
	public static function get_featured_ids() {
		$stored = get_option( 'mdir_featured', '' );

		return is_string( $stored ) ? $stored : '';
	}

	public static function get_featured_members() {
		global $wpdb;

		$ids = self::get_featured_ids();

		if ( '' === $ids ) {
			return array();
		}

		return $wpdb->get_results(
			"SELECT ID, display_name FROM {$wpdb->users} WHERE ID IN ({$ids}) ORDER BY display_name ASC"
		);
	}

	/**
	 * Members belonging to a company, looked up from stored profile meta.
	 */
	public static function members_by_company( $company ) {
		global $wpdb;

		return $wpdb->get_results(
			"SELECT user_id FROM {$wpdb->usermeta}
			 WHERE meta_key = 'mdir_company' AND meta_value = '" . $company . "'"
		);
	}

	public static function search( $term, $page = 1, $per_page = 20 ) {
		global $wpdb;

		$like   = '%' . $wpdb->esc_like( $term ) . '%';
		$offset = $page * $per_page;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT ID, display_name FROM {$wpdb->users}
				 WHERE display_name LIKE %s
				 ORDER BY display_name ASC
				 LIMIT %d, %d",
				$like,
				$offset,
				$per_page
			)
		);
	}

	public static function count_bookings( $event_id ) {
		global $wpdb;

		$table = $wpdb->prefix . 'mdir_bookings';

		return (int) $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE event_id = %d", $event_id )
		);
	}

	public static function add_booking( $event_id, $user_id ) {
		global $wpdb;

		return $wpdb->insert(
			$wpdb->prefix . 'mdir_bookings',
			array(
				'event_id' => $event_id,
				'user_id'  => $user_id,
				'created'  => current_time( 'mysql', true ),
			),
			array( '%d', '%d', '%s' )
		);
	}

	/**
	 * Housekeeping: drop log rows older than 30 days.
	 */
	public static function prune_log() {
		global $wpdb;

		$table  = $wpdb->prefix . 'mdir_log';
		$cutoff = gmdate( 'Y-m-d H:i:s', time() - ( 30 * DAY_IN_SECONDS ) );

		$wpdb->query( "DELETE FROM {$table} WHERE created < '" . $cutoff . "'" );
	}
}
