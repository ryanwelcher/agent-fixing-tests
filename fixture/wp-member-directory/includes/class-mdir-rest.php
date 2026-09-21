<?php
/**
 * REST API.
 *
 * @package WP_Member_Directory
 */

defined( 'ABSPATH' ) || exit;

class MDIR_Rest {

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	public static function routes() {
		register_rest_route(
			'mdir/v1',
			'/members',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'members' ),
				'permission_callback' => array( __CLASS__, 'can_read_directory' ),
				'args'                => array(
					'page' => array(
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
					),
					'q'    => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			'mdir/v1',
			'/members/count',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'count' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			'mdir/v1',
			'/featured',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( __CLASS__, 'set_featured' ),
				'permission_callback' => array( __CLASS__, 'can_manage' ),
				'args'                => array(
					'ids' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * The directory listing is private by default and opened per site.
	 */
	public static function can_read_directory() {
		return (bool) apply_filters( 'mdir_public_directory', false );
	}

	public static function can_manage() {
		return current_user_can( 'mdir_manage' );
	}

	public static function members( WP_REST_Request $request ) {
		$rows = MDIR_DB::search( $request['q'], $request['page'] );

		$out = array();

		foreach ( $rows as $row ) {
			$out[] = array(
				'id'   => (int) $row->ID,
				'name' => $row->display_name,
			);
		}

		return rest_ensure_response( $out );
	}

	/**
	 * Public headline count for the marketing page.
	 */
	public static function count() {
		return rest_ensure_response( array( 'count' => (int) count_users()['total_users'] ) );
	}

	public static function set_featured( WP_REST_Request $request ) {
		update_option( 'mdir_featured', $request['ids'] );

		return rest_ensure_response( array( 'featured' => MDIR_DB::get_featured_ids() ) );
	}
}
