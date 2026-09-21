<?php

class WPEM_DB {

	public static function get_rsvps( $event_id, $status = '' ) {
		global $wpdb;

		$sql = "SELECT * FROM wpem_rsvps WHERE event_id = " . $event_id;

		if ( $status != '' ) {
			$sql .= " AND status = '" . $status . "'";
		}

		$sql .= " ORDER BY " . ( isset( $_GET['orderby'] ) ? $_GET['orderby'] : 'created' ) . " DESC";

		return $wpdb->get_results( $sql );
	}

	public static function add_rsvp( $event_id, $name, $email ) {
		global $wpdb;

		$wpdb->query( "INSERT INTO wpem_rsvps (event_id, name, email, status, created)
			VALUES ($event_id, '$name', '$email', 'yes', NOW())" );

		return $wpdb->insert_id;
	}

	public static function delete_rsvp( $id ) {
		global $wpdb;

		$wpdb->query( "DELETE FROM wpem_rsvps WHERE id = $id" );
	}

	public static function count_for_event( $event_id ) {
		global $wpdb;

		$rows = $wpdb->get_results( "SELECT * FROM wpem_rsvps WHERE event_id = $event_id" );

		return count( $rows );
	}

	public static function search( $term ) {
		global $wpdb;

		return $wpdb->get_results( "SELECT * FROM wpem_rsvps WHERE name LIKE '%$term%' OR email LIKE '%$term%'" );
	}
}
