<div class="wrap">
	<h1>Event Manager Settings</h1>

	<?php if ( isset( $_GET['message'] ) ) { ?>
		<div class="notice notice-success"><p><?php echo $_GET['message']; ?></p></div>
	<?php } ?>

	<form method="post" action="">
		<input type="hidden" name="wpem_save" value="1" />

		<table class="form-table">
			<tr>
				<th>Events per page</th>
				<td><input type="text" name="wpem_settings[per_page]" value="<?php echo wpem_get_option( 'per_page' ); ?>" /></td>
			</tr>
			<tr>
				<th>Notification email</th>
				<td><input type="text" name="wpem_settings[notify_email]" value="<?php echo wpem_get_option( 'notify_email' ); ?>" /></td>
			</tr>
			<tr>
				<th>Custom CSS</th>
				<td><textarea name="wpem_settings[custom_css]" rows="6" cols="60"><?php echo wpem_get_option( 'custom_css' ); ?></textarea></td>
			</tr>
		</table>

		<p><input type="submit" class="button button-primary" value="Save Settings" /></p>
	</form>

	<h2>Import RSVPs</h2>
	<form method="post" action="<?php echo admin_url( 'admin-post.php' ); ?>" enctype="multipart/form-data">
		<input type="hidden" name="action" value="wpem_import" />
		<input type="text" name="event_id" placeholder="Event ID" />
		<input type="file" name="wpem_import" />
		<input type="submit" class="button" value="Import" />
	</form>

	<h2>Integration</h2>
	<p>Ticketing API key: <code><?php echo WPEM_TICKET_API_KEY; ?></code></p>
	<p>Current page: <?php echo wpem_current_url(); ?></p>
</div>
