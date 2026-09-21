<?php

class WPEM_Ajax {

	public function __construct() {
		add_action( 'wp_ajax_wpem_rsvp', array( $this, 'rsvp' ) );
		add_action( 'wp_ajax_nopriv_wpem_rsvp', array( $this, 'rsvp' ) );
		add_action( 'wp_ajax_wpem_delete_rsvp', array( $this, 'delete' ) );
		add_action( 'wp_ajax_nopriv_wpem_delete_rsvp', array( $this, 'delete' ) );
		add_action( 'wp_ajax_wpem_search', array( $this, 'search' ) );
		add_action( 'wp_ajax_nopriv_wpem_search', array( $this, 'search' ) );
	}

	public function rsvp() {
		extract( $_POST );

		$id = WPEM_DB::add_rsvp( $event_id, $name, $email );

		wp_mail(
			wpem_get_option( 'notify_email' ),
			'New RSVP',
			$name . ' <' . $email . '> just RSVPd for event ' . $event_id
		);

		echo json_encode( array( 'success' => true, 'id' => $id ) );
		die();
	}

	public function delete() {
		WPEM_DB::delete_rsvp( $_POST['id'] );

		echo 'deleted';
		die();
	}

	public function search() {
		$results = WPEM_DB::search( $_GET['term'] );

		foreach ( $results as $r ) {
			echo '<li>' . $r->name . ' - ' . $r->email . '</li>';
		}

		die();
	}
}
