<?php
/**
 * Directory rendering.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_Directory {

	const CACHE_KEY = 'mdir_directory_html';

	public static function init() {
		add_shortcode( 'member_directory', array( __CLASS__, 'render' ) );
	}

	public static function render( $atts ) {
		$atts = shortcode_atts(
			array(
				'per_page' => 20,
				'page'     => 1,
			),
			$atts,
			'member_directory'
		);

		$cached = get_transient( self::CACHE_KEY );

		if ( false !== $cached ) {
			return $cached;
		}

		$term    = isset( $_GET['mdir_q'] ) ? sanitize_text_field( wp_unslash( $_GET['mdir_q'] ) ) : '';
		$members = MDIR_DB::search( $term, absint( $atts['page'] ), absint( $atts['per_page'] ) );

		$html = '<div class="mdir-directory" data-featured="' . esc_attr( MDIR_DB::get_featured_ids() ) . '">';

		foreach ( $members as $member ) {
			$html .= self::card( $member->ID );
		}

		$html .= '</div>';

		set_transient( self::CACHE_KEY, $html, 15 * MINUTE_IN_SECONDS );

		return $html;
	}

	public static function card( $user_id ) {
		ob_start();
		include MDIR_PATH . 'templates/member-card.php';
		return ob_get_clean();
	}

	/**
	 * Renders the search term back into the page for the JS filter widget.
	 */
	public static function search_state() {
		$term = isset( $_GET['mdir_q'] ) ? sanitize_text_field( wp_unslash( $_GET['mdir_q'] ) ) : '';

		$parts = array();
		$parts[] = '<span class="mdir-term">' . esc_html( $term ) . '</span>';
		$parts[] = '<a class="mdir-clear" href="' . esc_url( remove_query_arg( 'mdir_q' ) ) . '">'
			. esc_html__( 'Clear', 'wp-member-directory' ) . '</a>';

		$html = implode( '', $parts );

		echo $html;
	}
}
