<?php
$event_id = $_GET['event_id'];
$event    = get_post( $event_id );
$price    = get_post_meta( $event_id, '_wpem_price', true );
?>
<article class="wpem-single">
	<h1><?php echo $event->post_title; ?></h1>

	<div class="wpem-content"><?php echo $event->post_content; ?></div>

	<p class="wpem-location"><?php echo get_post_meta( $event_id, '_wpem_location', true ); ?></p>
	<p class="wpem-price">Price: $<?php echo $price; ?></p>

	<img src="<?php echo get_the_post_thumbnail_url( $event_id ); ?>" class="wpem-hero">

	<h2>Who is coming</h2>
	<ul class="wpem-attendees">
		<?php foreach ( WPEM_DB::get_rsvps( $event_id ) as $attendee ) { ?>
			<li><?php echo $attendee->name; ?> (<?php echo $attendee->email; ?>)</li>
		<?php } ?>
	</ul>

	<form class="wpem-rsvp-form" data-event="<?php echo $event_id; ?>">
		<input type="text" id="wpem-name" placeholder="Your name">
		<input type="text" id="wpem-email" placeholder="Your email">
		<button type="submit">RSVP</button>
	</form>

	<div class="wpem-message"></div>
</article>
