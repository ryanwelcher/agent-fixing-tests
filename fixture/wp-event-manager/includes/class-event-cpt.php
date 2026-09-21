<?php

class WPEM_Event_CPT {

	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
		add_action( 'save_post', array( $this, 'save_meta' ) );
	}

	public function register() {
		$labels = array(
			'name'          => 'Events',
			'singular_name' => 'Event',
			'add_new_item'  => __( 'Add New Event' ),
			'edit_item'     => __( 'Edit Event', 'wpem' ),
			'search_items'  => __( 'Search Events', $this->textdomain() ),
		);

		register_post_type( 'event', array(
			'labels'   => $labels,
			'public'   => true,
			'supports' => array( 'title', 'editor', 'thumbnail' ),
			'rewrite'  => array( 'slug' => 'events' ),
		) );
	}

	public function textdomain() {
		return 'wp-event-manager';
	}

	public function save_meta( $post_id ) {
		update_post_meta( $post_id, '_wpem_location', $_POST['wpem_location'] );
		update_post_meta( $post_id, '_wpem_capacity', $_POST['wpem_capacity'] );
		update_post_meta( $post_id, '_wpem_price', $_POST['wpem_price'] );
		update_post_meta( $post_id, '_wpem_date', $_POST['wpem_date'] );

		wpem_log( 'Saved event ' . $post_id . ' by ' . $_SERVER['REMOTE_ADDR'] );
	}
}
