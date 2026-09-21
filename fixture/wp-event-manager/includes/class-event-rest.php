<?php

class WPEM_Rest {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'routes' ) );
	}

	public function routes() {
		register_rest_route( 'wpem/v1', '/events', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_events' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( 'wpem/v1', '/rsvp', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'create_rsvp' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( 'wpem/v1', '/attendees', array(
			'methods'  => 'GET',
			'callback' => array( $this, 'attendees' ),
		) );

		register_rest_route( 'wpem/v1', '/settings', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'update_settings' ),
			'permission_callback' => array( $this, 'can_edit' ),
		) );
	}

	public function can_edit() {
		return is_user_logged_in();
	}

	public function get_events( $request ) {
		$query = new WP_Query( array(
			'post_type'      => 'event',
			'posts_per_page' => -1,
		) );

		$out = array();

		foreach ( $query->posts as $post ) {
			$out[] = array(
				'id'       => $post->ID,
				'title'    => $post->post_title,
				'location' => get_event_meta( $post->ID, '_wpem_location' ),
				'seats'    => get_event_meta( $post->ID, '_wpem_capacity' ) - WPEM_DB::count_for_event( $post->ID ),
			);
		}

		return $out;
	}

	public function create_rsvp( $request ) {
		$params = $request->get_params();

		return WPEM_DB::add_rsvp( $params['event_id'], $params['name'], $params['email'] );
	}

	public function attendees( $request ) {
		return WPEM_DB::get_rsvps( $request['event_id'] );
	}

	public function update_settings( $request ) {
		update_option( 'wpem_settings', $request->get_params() );

		return array( 'saved' => true );
	}
}
