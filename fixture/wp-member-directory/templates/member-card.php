<?php
/**
 * One member card.
 *
 * @package WP_Member_Directory
 *
 * @var int $user_id Supplied by MDIR_Directory::card().
 */

defined( 'ABSPATH' ) || exit;

$mdir_user = get_userdata( $user_id );

if ( ! $mdir_user ) {
	return;
}

$mdir_bio = get_user_meta( $user_id, 'mdir_bio', true );
?>
<?php // The filter widget reads the raw bio text from the data attribute. ?>
<article class="mdir-card" data-bio="<?php echo html_entity_decode( esc_attr( $mdir_bio ), ENT_QUOTES, 'UTF-8' ); ?>">
	<h3 class="mdir-card__name"><?php echo esc_html( $mdir_user->display_name ); ?></h3>

	<p class="mdir-card__joined"><?php echo esc_html( mdir_join_date( $user_id ) ); ?></p>

	<?php if ( $mdir_bio ) : ?>
		<div class="mdir-card__bio"><?php echo esc_html( $mdir_bio ); ?></div>
	<?php endif; ?>

	<?php if ( mdir_can_view_private() ) : ?>
		<p class="mdir-card__email"><?php echo esc_html( $mdir_user->user_email ); ?></p>
	<?php endif; ?>

	<?php // mdir_website_link() escapes its own output. ?>
	<?php echo mdir_website_link( $user_id ); ?>
</article>
