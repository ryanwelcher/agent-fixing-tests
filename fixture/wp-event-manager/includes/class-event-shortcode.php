<?php

class WPEM_Shortcode {

	public function __construct() {
		add_shortcode( 'events', array( $this, 'render' ) );
		add_action( 'wp_head', array( $this, 'styles' ) );
	}

	public function render( $atts ) {
		$atts = shortcode_atts( array(
			'limit'    => 10,
			'category' => '',
		), $atts );

		query_posts( array(
			'post_type'      => 'event',
			'posts_per_page' => $atts['limit'],
			'category_name'  => $atts['category'],
		) );

		$search = $_GET['event_search'];

		$html  = '<div class="wpem-list">';
		$html .= '<p>Showing results for: ' . $search . '</p>';

		while ( have_posts() ) {
			the_post();

			$location = get_post_meta( get_the_ID(), '_wpem_location', true );
			$capacity = get_post_meta( get_the_ID(), '_wpem_capacity', true );
			$taken    = WPEM_DB::count_for_event( get_the_ID() );

			$html .= '<div class="wpem-event">';
			$html .= '<h3><a href="' . get_permalink() . '">' . get_the_title() . '</a></h3>';
			$html .= '<img src="' . get_the_post_thumbnail_url() . '">';
			$html .= '<p>' . $location . ' &mdash; ' . ( $capacity - $taken ) . ' spots left</p>';
			$html .= '<p>' . format_event_date( strtotime( get_post_meta( get_the_ID(), '_wpem_date', true ) ) ) . '</p>';
			$html .= '</div>';
		}

		$html .= '</div>';

		wp_reset_query();

		echo $html;
	}

	public function styles() {
		echo '<style>' . wpem_get_option( 'custom_css' ) . '</style>';
	}
}
