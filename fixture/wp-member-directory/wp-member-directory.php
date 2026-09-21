<?php
/**
 * Plugin Name: WP Member Directory
 * Description: A searchable member directory with profiles, favourites and seat booking.
 * Version: 2.1.0
 * Author: Acme Plugins
 * Text Domain: wp-member-directory
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

define( 'MDIR_VERSION', '2.1.0' );
define( 'MDIR_PATH', plugin_dir_path( __FILE__ ) );
define( 'MDIR_URL', plugin_dir_url( __FILE__ ) );

require_once MDIR_PATH . 'includes/functions.php';
require_once MDIR_PATH . 'includes/class-mdir-roles.php';
require_once MDIR_PATH . 'includes/class-mdir-db.php';
require_once MDIR_PATH . 'includes/class-mdir-profile.php';
require_once MDIR_PATH . 'includes/class-mdir-directory.php';
require_once MDIR_PATH . 'includes/class-mdir-booking.php';
require_once MDIR_PATH . 'includes/class-mdir-ajax.php';
require_once MDIR_PATH . 'includes/class-mdir-rest.php';

add_action( 'plugins_loaded', 'mdir_bootstrap' );

function mdir_bootstrap() {
	MDIR_Roles::init();
	MDIR_Profile::init();
	MDIR_Directory::init();
	MDIR_Booking::init();
	MDIR_Ajax::init();
	MDIR_Rest::init();
}

/**
 * The directory is a public marketing surface on this site, so the REST
 * listing is opened up here rather than in the route definition.
 */
add_filter( 'mdir_public_directory', '__return_true' );

add_action( 'wp_enqueue_scripts', 'mdir_assets' );

function mdir_assets() {
	wp_enqueue_script(
		'mdir-directory',
		MDIR_URL . 'assets/js/directory.js',
		array( 'jquery' ),
		MDIR_VERSION,
		true
	);

	wp_localize_script(
		'mdir-directory',
		'mdirConfig',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'restUrl' => esc_url_raw( rest_url( 'mdir/v1' ) ),
		)
	);
}

register_activation_hook( __FILE__, 'mdir_activate' );

function mdir_activate() {
	global $wpdb;

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	$table   = $wpdb->prefix . 'mdir_bookings';
	$collate = $wpdb->get_charset_collate();

	dbDelta(
		"CREATE TABLE {$table} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			event_id BIGINT UNSIGNED NOT NULL,
			user_id BIGINT UNSIGNED NOT NULL,
			created DATETIME NOT NULL,
			PRIMARY KEY (id),
			KEY event_id (event_id)
		) {$collate};"
	);

	MDIR_Roles::add_caps();
}
