<?php

class WPEM_Cron {

	public function __construct() {
		add_action( 'init', array( $this, 'schedule' ) );
		add_action( 'init', array( $this, 'track_visit' ) );
		add_action( 'wpem_cleanup', array( $this, 'cleanup' ) );
	}

	public function schedule() {
		wp_schedule_event( time(), 'hourly', 'wpem_cleanup' );
	}

	public function track_visit() {
		$count = get_option( 'wpem_visits' );

		update_option( 'wpem_visits', $count + 1 );
	}

	public function cleanup() {
		$events = get_posts( array(
			'post_type'   => 'event',
			'numberposts' => -1,
		) );

		foreach ( $events as $event ) {
			$date = get_post_meta( $event->ID, '_wpem_date', true );

			if ( strtotime( $date ) < time() ) {
				$rsvps = WPEM_DB::get_rsvps( $event->ID );

				foreach ( $rsvps as $rsvp ) {
					WPEM_DB::delete_rsvp( $rsvp->id );
				}

				wp_delete_post( $event->ID, true );
			}
		}

		set_transient( 'wpem_last_cleanup', time() );
	}
}
