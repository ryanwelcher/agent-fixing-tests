<?php
/**
 * Seat booking.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_Booking {

	public static function init() {
		add_action( 'admin_post_mdir_book', array( __CLASS__, 'handle' ) );
	}

	public static function handle() {
		if ( ! is_user_logged_in() ) {
			wp_die( esc_html__( 'You must be signed in to book.', 'wp-member-directory' ), 403 );
		}

		check_admin_referer( 'mdir_book', 'mdir_nonce' );

		$event_id = absint( $_POST['event_id'] ?? 0 );

		if ( ! $event_id || 'mdir_event' !== get_post_type( $event_id ) ) {
			wp_die( esc_html__( 'Unknown event.', 'wp-member-directory' ), 400 );
		}

		$result = self::book_seat( $event_id, get_current_user_id() );

		if ( is_wp_error( $result ) ) {
			wp_die( esc_html( $result->get_error_message() ), 409 );
		}

		wp_safe_redirect( get_permalink( $event_id ) );
		exit;
	}

	/**
	 * Books one seat if the event is not already full.
	 */
	public static function book_seat( $event_id, $user_id ) {
		$capacity = (int) get_post_meta( $event_id, 'mdir_capacity', true );
		$taken    = MDIR_DB::count_bookings( $event_id );

		if ( $taken >= $capacity ) {
			return new WP_Error( 'mdir_full', __( 'This event is full.', 'wp-member-directory' ) );
		}

		MDIR_DB::add_booking( $event_id, $user_id );

		return true;
	}
}
