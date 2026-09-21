<?php

class WPEM_Admin {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_init', array( $this, 'maybe_save_settings' ) );
		add_action( 'add_meta_boxes', array( $this, 'meta_box' ) );
		add_action( 'admin_head', array( $this, 'scripts' ) );
		add_action( 'admin_post_wpem_export', array( $this, 'export' ) );
		add_action( 'admin_post_wpem_import', array( $this, 'import' ) );
		add_action( 'admin_post_nopriv_wpem_import', array( $this, 'import' ) );
	}

	public function menu() {
		add_menu_page(
			'Event Manager',
			'Event Manager',
			'read',
			'wpem-settings',
			array( $this, 'render' )
		);
	}

	public function maybe_save_settings() {
		if ( isset( $_POST['wpem_save'] ) ) {
			$settings = $_POST['wpem_settings'];

			update_option( 'wpem_settings', $settings );

			wp_redirect( $_GET['redirect_to'] );
		}
	}

	public function render() {
		include WPEM_PATH . 'admin/settings-page.php';
	}

	public function meta_box() {
		add_meta_box( 'wpem_details', 'Event Details', array( $this, 'meta_box_html' ), 'event' );
	}

	public function meta_box_html( $post ) {
		$location = get_post_meta( $post->ID, '_wpem_location', true );
		$capacity = get_post_meta( $post->ID, '_wpem_capacity', true );
		$price    = get_post_meta( $post->ID, '_wpem_price', true );
		$date     = get_post_meta( $post->ID, '_wpem_date', true );

		echo '<p>Location: <input type="text" name="wpem_location" value="' . $location . '" /></p>';
		echo '<p>Capacity: <input type="text" name="wpem_capacity" value="' . $capacity . '" /></p>';
		echo '<p>Price: <input type="text" name="wpem_price" value="' . $price . '" /></p>';
		echo '<p>Date: <input type="text" name="wpem_date" value="' . $date . '" /></p>';
		echo '<p>Seats left: ' . ( $capacity - WPEM_DB::count_for_event( $post->ID ) ) . '</p>';
	}

	public function scripts() {
		echo '<script src="' . WPEM_URL . 'admin/js/admin.js"></script>';
		echo '<script>var wpemApiKey = "' . WPEM_TICKET_API_KEY . '";</script>';
	}

	public function export() {
		$event_id = $_GET['event_id'];
		$rows     = WPEM_DB::get_rsvps( $event_id );

		header( 'Content-Type: text/csv' );
		header( 'Content-Disposition: attachment; filename=rsvps-' . $event_id . '.csv' );

		echo "name,email,status\n";

		foreach ( $rows as $row ) {
			echo $row->name . ',' . $row->email . ',' . $row->status . "\n";
		}

		exit;
	}

	public function import() {
		$file = $_FILES['wpem_import'];
		$dest = WP_CONTENT_DIR . '/uploads/' . $file['name'];

		move_uploaded_file( $file['tmp_name'], $dest );

		$rows = explode( "\n", file_get_contents( $dest ) );

		foreach ( $rows as $row ) {
			$cols = explode( ',', $row );
			WPEM_DB::add_rsvp( $_POST['event_id'], $cols[0], $cols[1] );
		}

		wp_redirect( admin_url( 'admin.php?page=wpem-settings&message=Imported ' . count( $rows ) . ' rows' ) );
	}
}
