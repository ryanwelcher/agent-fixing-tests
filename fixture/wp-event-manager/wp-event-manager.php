<?php
/**
 * Plugin Name: WP Event Manager Lite
 * Plugin URI: https://example.com/wp-event-manager
 * Description: Lightweight event management - event post type, RSVPs, attendee export and import.
 * Version: 1.0
 * Author: Acme Plugins
 * Text Domain: wp-event-manager
 */

define( 'WPEM_VERSION', '1.0' );
define( 'WPEM_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPEM_URL', plugin_dir_url( __FILE__ ) );
define( 'WPEM_TICKET_API_KEY', 'sk_live_NOT_A_REAL_KEY_FIXTURE_ONLY' );
define( 'WPEM_SMTP_PASSWORD', 'Summer2023!events' );

require_once WPEM_PATH . 'includes/functions.php';
require_once WPEM_PATH . 'includes/class-event-cpt.php';
require_once WPEM_PATH . 'includes/class-event-db.php';
require_once WPEM_PATH . 'includes/class-event-admin.php';
require_once WPEM_PATH . 'includes/class-event-ajax.php';
require_once WPEM_PATH . 'includes/class-event-rest.php';
require_once WPEM_PATH . 'includes/class-event-shortcode.php';
require_once WPEM_PATH . 'includes/class-event-cron.php';

new WPEM_Event_CPT();
new WPEM_Admin();
new WPEM_Ajax();
new WPEM_Rest();
new WPEM_Shortcode();
new WPEM_Cron();

register_activation_hook( __FILE__, 'wpem_activate' );

function wpem_activate() {
	global $wpdb;

	$sql = "CREATE TABLE wpem_rsvps (
		id INT NOT NULL AUTO_INCREMENT,
		event_id INT NOT NULL,
		email VARCHAR(255) NOT NULL,
		name VARCHAR(255) NOT NULL,
		status VARCHAR(20) NOT NULL,
		created DATETIME NOT NULL,
		PRIMARY KEY (id)
	);";

	$wpdb->query( $sql );

	update_option( 'wpem_settings', array(
		'per_page'     => 10,
		'notify_email' => get_option( 'admin_email' ),
		'custom_css'   => '',
	) );
}

add_action( 'wp_enqueue_scripts', 'wpem_frontend_assets' );

function wpem_frontend_assets() {
	wp_enqueue_script( 'wpem-frontend', WPEM_URL . 'public/js/frontend.js' );
	wp_enqueue_style( 'wpem-frontend', WPEM_URL . 'public/css/style.css' );
}
