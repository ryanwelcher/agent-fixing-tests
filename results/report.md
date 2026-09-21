# Two-model review handoff: results

_Generated 2026-09-21 20:52 from 10 run(s) in `results/runs.jsonl` (5 superseded row(s) ignored)._

Fixture: `wp-event-manager`, a WordPress plugin with 76 deliberately seeded defects
(22 critical, 32 high, 13 medium, 9 low). 75 are checked by deterministic regex detectors;
one is graded by hand. Fix rate is measured on the code, not claimed by the model.

## Headline

Two fix rates. **Detector** is the optimistic one: the broken pattern is gone and a
plausible API appears. **Verified** is the honest one: a judge read the code and confirmed
the defect is actually gone. Quote the verified number.

| Arm | Reviewer | Implementer | Detector | Verified | Verified rate | Cost | Tokens | Wall | Cost/verified fix | Surface | Lint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | haiku | 35/75 | 31/75 | 41% | $0.709 | 3,130,483 | 12m03s | $0.023 | intact | pass |
| `handoff` | opus | sonnet | 64/75 | 56/75 | 75% | $2.942 | 1,000,229 | 17m53s | $0.053 | intact | pass |
| `handoff` | opus | haiku | 62/75 | 58/75 | 77% | $2.750 | 4,123,535 | 21m37s | $0.047 | intact | pass |
| `handoff-review` | opus | sonnet | 58/75 | 52/75 | 69% | $2.899 | 1,015,464 | 19m29s | $0.056 | intact | pass |
| `handoff-review` | opus | haiku | 63/75 | 60/75 | 80% | $3.230 | 3,616,472 | 20m04s | $0.054 | intact | pass |
| `oneshot` | opus | opus | 69/75 | 67/75 | 89% | $2.885 | 1,490,744 | 16m25s | $0.043 | intact | pass |
| `skill` | opus | sonnet | 62/75 | 57/75 | 76% | $4.243 | 1,077,360 | 21m29s | $0.074 | intact | pass |
| `handoff` | opus | opus | 62/75 | 58/75 | 77% | $5.455 | 2,730,639 | 22m47s | $0.094 | intact | pass |
| `handoff` | opus | sonnet | 9/9 | 9/9 | 100% | $1.887 | 824,047 | 11m11s | $0.210 | - | pass |
| `oneshot` | opus | opus | 8/9 | 8/9 | 89% | $1.739 | 776,638 | 9m09s | $0.217 | - | pass |

## Fix quality

Of the fixes the detectors passed, how many survive reading the code.

| Arm | Implementer | Correct | Superficial | Removed feature | Uncertain | Regressions introduced | Detector overstated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | 31 | 4 | 0 | 0 | 11 | 11% |
| `handoff` | sonnet | 56 | 5 | 3 | 0 | 8 | 13% |
| `handoff` | haiku | 58 | 3 | 1 | 0 | 12 | 6% |
| `handoff-review` | sonnet | 52 | 5 | 1 | 0 | 8 | 10% |
| `handoff-review` | haiku | 60 | 2 | 1 | 0 | 7 | 5% |
| `oneshot` | opus | 67 | 2 | 0 | 0 | 5 | 3% |
| `skill` | sonnet | 57 | 3 | 2 | 0 | 6 | 8% |
| `handoff` | opus | 58 | 3 | 1 | 0 | 7 | 6% |
| `handoff` | sonnet | 9 | 0 | 0 | 0 | 6 | 0% |
| `oneshot` | opus | 8 | 0 | 0 | 0 | 5 | 0% |

### Regressions the fix introduced

- `handoff` — **high** `includes/class-event-admin.php:32` — "'custom_css' => wp_kses_allowed_html( $_POST['wpem_settings']['custom_css'], 'post' )" stores WordPress's allowed-tags array (not the CSS) in the option, so Custom CSS is destroyed on every save and wp_kses_post() on that array prints the literal "Array" plus an Array-to-string warning in <style> on every front-end page (class-event-shortcode.php:64) and in the settings textarea (admin/settings-page.php:23).
- `handoff` — **high** `includes/class-event-admin.php:37` — "wp_safe_remote_get( admin_url( 'admin.php?page=wpem-settings' ) );" replaced wp_redirect() - saving settings no longer redirects (POST stays in history / resubmits) and instead fires a blocking server-side loopback HTTP request to wp-admin on every save.
- `handoff` — **high** `public/js/frontend.js:11` — "nonce: jQuery('#wpem-nonce').val()" but wp_nonce_field( 'wpem_rsvp_nonce', 'nonce' ) at templates/event-single.php:27 renders id="nonce" - the selector never matches, an empty nonce is posted and check_ajax_referer() kills every RSVP with -1; public RSVP is completely broken.
- `handoff` — **high** `admin/js/admin.js:5` — "nonce: jQuery('#wpem-delete-rsvp-nonce').val()" - no element with that id is rendered anywhere in the plugin, so wpemDeleteRsvp() always fails check_ajax_referer() and RSVP deletion never works.
- `handoff` — **medium** `public/js/frontend.js:29` — "&nonce=' + jQuery('#wpem-search-nonce').val()" - that field is never rendered, so the search request always sends nonce=undefined and dies at check_ajax_referer(); the handler additionally now requires manage_options, so the front-end search box can never work.
- `handoff` — **medium** `includes/class-event-admin.php:97` — "if ( ! in_array( $file['type'], $allowed_types, true ) )" validates the client-supplied MIME header from $_FILES, which an attacker sets freely - it is not real file-type validation (wp_check_filetype_and_ext() is); the nonce/capability checks are what actually protect the importer.
- `handoff` — **low** `includes/class-event-admin.php:68` — export() now requires "check_admin_referer( 'wpem_export_nonce', 'wpem_nonce' )" but nothing in the plugin generates an export URL carrying that nonce, so the CSV export is unreachable from any UI and any existing bookmark wp_die()s.
- `handoff` — **low** `includes/class-event-cpt.php:40` — "current_user_can( 'edit_posts' ) || wp_die();" aborts the whole save_post request with a bare wp_die for any programmatic/low-cap save of an event, and the generic edit_posts cap is not the per-post edit_post( $post_id ) check; the meta box still has no nonce.
- `handoff` — **low** `templates/event-single.php:2` — "$event_id = intval( $_GET['event_id'] );" has no isset() guard, so a request without event_id raises an undefined-key warning and then hard-stops the page with wp_die( 'Event not found' ) (untranslated) instead of rendering.
- `handoff` — **low** `includes/functions.php:47` — wpem_current_url() now always returns admin_url( 'admin.php?page=wpem-settings' ) - the helper no longer returns the current URL, it just happens to look right on the one page that calls it.
- `handoff` — **low** `includes/class-event-admin.php:123` — "$status = isset( $cols[2] ) ? sanitize_text_field( $cols[2] ) : 'yes';" is parsed and then never passed to WPEM_DB::add_rsvp() on line 127, so an imported CSV's status column is silently discarded and every row is stored as 'yes'.
- `handoff` — **high** `plugin/includes/class-event-admin.php:84` — The date field changed from type="text" to '<input type="datetime-local" id="wpem_date" name="wpem_date" value="%s" />', but stored _wpem_date values are free-form strings (everything else parses them with strtotime()); any value not in YYYY-MM-DDTHH:MM renders as an empty control and the next save writes it away, because class-event-cpt.php:57 stores whatever is posted whenever isset($_POST['wpem_date']) - silent loss of existing event dates.
- `handoff` — **high** `plugin/wp-event-manager.php:50` — The legacy-table rename ('RENAME TABLE {$legacy} TO {$table}') only runs from register_activation_hook, which does not fire on an in-place plugin update, so an upgraded site keeps its unprefixed wpem_rsvps table while class-event-db.php:7 now queries $wpdb->prefix.'wpem_rsvps' - every RSVP read/write silently hits a missing table until the plugin is deactivated and reactivated.
- `handoff` — **medium** `plugin/includes/class-event-shortcode.php:11` — shortcode_atts() was reduced to array( 'limit' => 10 ) and 'category_name' dropped from the query, so existing [events category="..."] shortcodes now silently list every event instead of the filtered set.
- `handoff` — **medium** `plugin/uninstall.php:17` — 'do { $posts = get_posts(...); foreach ... wp_delete_post( $post_id, true ); } while ( ! empty( $posts ) );' never terminates if a deletion is blocked (e.g. a pre_delete_post filter), hanging the uninstall request; and because 'post_status' => 'any' excludes trash, the events the new cron wp_trash_post()s are left in the database forever.
- `handoff` — **low** `plugin/includes/class-event-admin.php:123` — export() now requires check_admin_referer( 'wpem_export' ) but nothing in the plugin ever generates an export URL carrying _wpnonce, so the CSV export is only reachable by hand-crafting a nonced link.
- `handoff` — **low** `plugin/admin/js/admin.js:22` — The attendee search moved out of frontend.js into admin.js behind the wpem_admin nonce, but the settings page renders no #wpem-search or #wpem-results markup and admin.js only loads on that page - the search feature is now unreachable dead code.
- `handoff` — **low** `plugin/admin/settings-page.php:51` — '<h2>Integration</h2>' is left with no body after the API-key paragraph was deleted, and wpem_get_ticket_api_key() (functions.php:28) has no callers and no UI to populate wpem_ticket_api_key, so the ticketing integration is unconfigurable.
- `handoff` — **low** `plugin/includes/class-event-cpt.php:54` — 'update_post_meta( $post_id, '_wpem_price', (float) wp_unslash( $_POST['wpem_price'] ) )' coerces previously free-text prices, so a stored '10.00 USD' becomes 10 and a comma-decimal '10,50' becomes 10 on the next save.
- `handoff` — **medium** `plugin/includes/class-event-admin.php:115` — get_rsvps() gained a '$limit = 500' default, so 'WPEM_DB::get_rsvps( $event_id )' now silently truncates the CSV export (and REST /attendees, and the single-event attendee list) at 500 rows with no warning or pagination.
- `handoff` — **medium** `plugin/uninstall.php:15` — The loop force-deletes posts while paging over them ('paged' => $paged with wp_delete_post($id, true)), so the result set shifts under the offset and roughly half the events survive uninstall - events 201-400 are skipped after page 1 deletes 1-200.
- `handoff` — **medium** `plugin/includes/class-event-cron.php:43` — Cleanup no longer deletes RSVP rows at all (the 'foreach ( $rsvps as $rsvp ) WPEM_DB::delete_rsvp(...)' block was dropped), so attendee rows - including email PII that used to be purged - accumulate forever and are orphaned once the trashed event is emptied.
- `handoff` — **medium** `plugin/includes/class-event-shortcode.php:79` — "echo '<style id=\"wpem-custom-css\">' . esc_html( wp_strip_all_tags( $css ) ) . '</style>'" - esc_html inside <style> is not decoded by browsers, so any saved CSS using a child selector ('>' becomes '&gt;') or '&' (media queries, nesting) is now broken.
- `handoff` — **medium** `plugin/public/js/frontend.js:30` — 'resultsEl.innerHTML = '';' - the search box still fires an AJAX request on every keyup but the results are never rendered; the front-end search feature now does nothing.
- `handoff` — **medium** `plugin/includes/class-event-rest.php:144` — update_settings() reads '$request->get_json_params()', which is null for a form-encoded or query-string POST, so a valid non-JSON request to /wpem/v1/settings saves nothing yet still returns {"saved":true}; it also bypasses the sanitize_callbacks declared in the route args.
- `handoff` — **low** `plugin/includes/class-event-rest.php:52` — "'validate_callback' => 'is_email'" - REST calls validators as callback($value, $request, $param), and is_email()'s second parameter is $deprecated, so every /rsvp request triggers a _deprecated_argument() notice.
- `handoff` — **low** `plugin/public/js/frontend.js:25` — The front-end search sends 'wpemData.nonce' (created for the 'wpem_rsvp' action) to wpem_search, which calls check_ajax_referer( 'wpem_admin', 'nonce' ) and also now requires edit_posts - the request can never succeed.
- `handoff` — **low** `plugin/includes/class-event-admin.php:101` — 'if ( in_array( $value[0], ... ) )' dereferences offset 0 without checking length, raising an 'Uninitialized string offset 0' warning in PHP 8 for any empty name/email/status cell during export.
- `handoff` — **low** `plugin/wp-event-manager.php:57` — '$wpdb->query( "INSERT INTO {$new_table} SELECT * FROM wpem_rsvps" );' - return value unchecked and wpem_migrated_to_prefix is set regardless, so a failed migration (e.g. rows longer than the new VARCHAR(191) under strict mode) is recorded as done and never retried; the old table is also left behind.
- `handoff` — **low** `plugin/includes/class-event-cron.php:17` — Same paging-while-mutating bug as uninstall: events are trashed inside a loop paging over 'post_status' => 'publish', so each run skips up to 50 expired events per page boundary (self-heals over later hourly runs).
- `handoff` — **low** `plugin/includes/class-event-admin.php:112` — export() now requires check_admin_referer( 'wpem_export' ), but nothing in the plugin renders an export link carrying that nonce, so the CSV export is unreachable from the UI.
- `handoff-review` — **medium** `plugin/templates/event-single.php:1` — The whole templates/ directory was deleted rather than fixed ('Only in .../plugin: templates' in fix.diff) - it held the single-event template with the RSVP form markup (.wpem-rsvp-form, #wpem-name, #wpem-email, .wpem-message) that public/js/frontend.js and public/css/style.css still target, plus the attendee list; no claim covers that file, and a theme that included it now includes a missing file.
- `handoff-review` — **low** `plugin/includes/functions.php:41` — 'return home_url( add_query_arg( array(), $wp->request ) );' - $wp->request is null in wp-admin (parse_request never runs), so the only caller, admin/settings-page.php:45 'Current page:', now prints the site home URL instead of the current admin URL and passes null into add_query_arg(), which trips PHP 8.1+ deprecation notices.
- `handoff-review` — **medium** `plugin/includes/class-event-cron.php:58` — 'wp_delete_post( $event->ID, false );' trashes the event as recoverable, but lines 54-56 have already permanently deleted its RSVP rows - restoring a trashed event now brings back an event whose attendee list is irrecoverably gone, and readme.txt advertises this as 'expired events go to the trash'.
- `handoff-review` — **low** `plugin/uninstall.php:25` — "'post_status' => 'any'" excludes trashed posts, so the events the new cron trashes (class-event-cron.php:58) are left behind in the database after uninstall - the old force-delete cron plus force-delete uninstall left nothing.
- `handoff-review` — **low** `plugin/uninstall.php:22` — 'do { ... } while ( $query->posts );' re-runs the same query until it returns nothing; if any returned post fails to delete (e.g. a plugin short-circuits pre_delete_post), the same 200 ids come back forever and uninstall hangs until the PHP timeout. The previous code queried once.
- `handoff-review` — **low** `plugin/includes/class-event-cpt.php:26` — "'show_in_rest' => true" was added to register_post_type, which switches the Event editor from classic to the block editor and exposes /wp/v2/event - a user-visible change no claim asked for (meta box saving still works via the block editor's compat form).
- `handoff-review` — **low** `plugin/admin/js/admin.js:22` — The newly added search handler binds to '#wpem-search' and writes to '#wpem-results', but nothing in the plugin renders those elements (admin/settings-page.php has no search field) and the previous front-end consumer was deleted - the wpem_search endpoint is now unreachable from any shipped UI.
- `handoff-review` — **low** `plugin/includes/class-event-rest.php:50` — GET /wpem/v1/events now returns 20 events by default instead of every event; existing API consumers that relied on the unpaginated response silently get a truncated list (no total/pagination headers are sent).
- `handoff-review` — **medium** `includes/class-event-ajax.php:65` — Nonce action mismatch breaks the search endpoint: the handler calls check_ajax_referer( 'wpem_admin', 'nonce' ) but the only caller, public/js/frontend.js:28, sends 'nonce: wpemFront.nonce' created with wp_create_nonce( 'wpem_frontend' ), so every request dies with -1 even for an administrator.
- `handoff-review` — **low** `includes/class-event-admin.php:102` — export() now requires check_admin_referer( 'wpem_export' ) but no screen renders a wpem_export link or nonce anywhere in the plugin, so CSV export is unreachable for legitimate admins.
- `handoff-review` — **low** `uninstall.php:17` — The new 'do { ... } while ( ! empty( $posts ) );' batch loop never breaks on failure - if wp_delete_post( $post_id, true ) is blocked (e.g. a before_delete_post hook) get_posts keeps returning the same 200 ids and uninstall spins until the PHP timeout.
- `handoff-review` — **low** `wp-event-manager.php:53` — 'PRIMARY KEY (id),' uses a single space; dbDelta requires two spaces after PRIMARY KEY, so on re-activation dbDelta emits a redundant ADD PRIMARY KEY and a 'Multiple primary key defined' DB error.
- `handoff-review` — **low** `includes/class-event-cron.php:16` — 'posts_per_page' => 100 caps the hourly cleanup at 100 events per run with no repeat scheduling, so a site with a large backlog of past events now clears it far more slowly than the previous -1 sweep.
- `handoff-review` — **low** `includes/functions.php:41` — home_url( add_query_arg( array() ) ) concatenates the full REQUEST_URI onto the home URL, so on a subdirectory install it returns https://example.com/blog/blog/page - wrong URL (currently harmless: the function has no callers left).
- `handoff-review` — **low** `includes/class-event-rest.php:98` — The /settings route declares no args schema, so an array-valued custom_css reaches wp_strip_all_tags( $request['custom_css'] ) and throws a TypeError from strip_tags() on PHP 8 (admin-only 500).
- `oneshot` — **low** `plugin/public/js/frontend.js:18` — The error branch "} else if ( response && response.data && response.data.message ) {" is unreachable: wp_send_json_error( ..., 400 ) sets an HTTP 400/403/500 status, so jQuery routes the response to its fail handler and never calls this success callback - a visitor who submits a bad name/email gets silence instead of the message the code intends to show.
- `oneshot` — **low** `plugin/includes/class-event-admin.php:51` — "wp_strip_all_tags( $submitted['custom_css'] )" (and sanitize_email on line 50) is called on a value only known to be an element of an array - posting wpem_settings[custom_css][]=x raises a PHP 8 TypeError and fatals the settings save; previously the array was stored without error. Needs an authenticated admin plus a valid nonce, so it is self-inflicted only.
- `oneshot` — **low** `plugin/templates/event-single.php:30` — "echo wp_kses_post( apply_filters( 'the_content', $wpem_event->post_content ) );" runs kses over already-filtered output, so oEmbed/iframe embeds (not in $allowedposttags) are stripped from event bodies that rendered fine before - a visible content change on pages with embedded video or maps.
- `oneshot` — **low** `plugin/includes/functions.php:56` — "return home_url( add_query_arg( array() ) );" doubles the subdirectory segment on subdirectory installs, because home_url() already contains the path that REQUEST_URI repeats. No impact today - the settings-page call site was deleted in the same change, leaving the helper unused - but the helper is wrong for the next caller.
- `oneshot` — **low** `plugin/uninstall.php:22` — The "do { ... } while ( count( $wpem_post_ids ) === 200 );" batch loop relies on wp_delete_post() actually removing each post to make progress; if a deletion is blocked (e.g. a plugin short-circuits pre_delete_post) the same 200 ids are fetched forever and uninstall hangs. Also, post_status 'any' excludes trashed events, so they are left behind.
- `skill` — **medium** `plugin/includes/class-event-shortcode.php:74` — echo '<style>' . esc_html( wp_strip_all_tags( $css ) ) . '</style>'; - CSS does not decode HTML entities, so any custom CSS using a child combinator or quotes now renders as '.a &gt; .b { content: &quot;x&quot;; }' and silently stops applying.
- `skill` — **medium** `plugin/includes/class-event-cron.php:40` — cleanup() dropped the 'foreach ( $rsvps as $rsvp ) { WPEM_DB::delete_rsvp( $rsvp->id ); }' loop, so RSVP rows (names and emails) are never removed when an event is cleaned up - orphaned PII now accumulates in wpem_rsvps forever.
- `skill` — **low** `plugin/includes/class-event-cron.php:40` — wp_delete_post( $event->ID, true ) became 'wp_trash_post( $event_id );' - past events now pile up in the Trash instead of disappearing, a visible change for anyone relying on the old behaviour.
- `skill` — **low** `plugin/includes/class-event-cron.php:22` — 'posts_per_page' => 100 caps cleanup at 100 events per hourly run with no ordering or offset, so a site with a large backlog of past events drains it only 100 per hour.
- `skill` — **low** `plugin/wp-event-manager.php:61` — 'PRIMARY KEY (id),' is passed to dbDelta() with a single space; dbDelta's documented parser needs two, so re-running activation can emit a duplicate ADD PRIMARY KEY and a MySQL error on upgrade.
- `skill` — **low** `plugin/templates` — fix.diff line 1022 'Only in .../plugin: templates' - the entire templates/ directory was deleted; no claim covers it and nothing in the fixed tree references it, so it is silent scope creep rather than a crash.
- `handoff` — **medium** `includes/class-event-shortcode.php:62` — esc_html( format_event_date( strtotime( (string) $date ) ) ) - WordPress forces PHP's default timezone to UTC, so strtotime() reads the naive '_wpem_date' string as UTC and wp_date() then shifts it into the site timezone; an event saved as 18:00 renders as 14:00 on a UTC-5 site, where the old date() call showed 18:00.
- `handoff` — **medium** `includes/class-event-admin.php:88` — The date field changed to 'type="datetime-local"', which renders empty for any previously stored value not in YYYY-MM-DDTHH:MM form; re-saving then posts an empty string and class-event-cpt.php:63 stores '' (strtotime false), silently wiping the event date.
- `handoff` — **medium** `public/js/frontend.js:28` — $.get( wpemAdmin.ajaxUrl, { ... nonce: wpemAdmin.nonce ... } ) sits in the frontend bundle, but only 'wpemFront' is localized for the wpem-frontend handle, so the search handler throws 'ReferenceError: wpemAdmin is not defined' the moment a #wpem-search element exists on the front end.
- `handoff` — **medium** `templates/event-single.php:18` — wp_kses_post( apply_filters( 'the_content', $event->post_content ) ) runs kses after the filters, stripping markup WordPress itself generated - oEmbed <iframe>s and shortcode-emitted <script>/<iframe> vanish from event content.
- `handoff` — **low** `includes/class-event-admin.php:43` — sanitize_email( $posted['notify_email'] ) / wp_strip_all_tags( $posted['custom_css'] ) receive whatever shape was posted; an admin submitting wpem_settings[notify_email][]=x passes an array and fatals with a PHP 8 TypeError instead of being rejected.
- `handoff` — **low** `uninstall.php:31` — 'paged' => $paged with $paged never incremented - the do/while only terminates because the posts are force-deleted, so a single post whose deletion is blocked by a filter makes uninstall spin forever.
- `handoff` — **low** `templates/event-single.php:26` — Price output changed from 'Price: $<price>' to number_format_i18n( (float) $price, 2 ) with no currency symbol, so '$25' now renders as '25.00'.
- `handoff` — **medium** `wp-member-directory.php:37` — `if ( get_option( 'mdir_db_version' ) !== MDIR_VERSION )` runs dbDelta from plugins_loaded, so front-end visitors load wp-admin/includes/upgrade.php and race to ALTER the table, and `update_option( 'mdir_db_version', MDIR_VERSION )` records success even when dbDelta's ALTER failed.
- `handoff` — **medium** `includes/class-mdir-directory.php:32` — The transient key is now `md5()` over the attacker-controlled `$_GET['mdir_q']`, so requests with random search terms create unbounded 15-minute transients (wp_options bloat) where the old code used one fixed key.
- `handoff` — **medium** `includes/class-mdir-booking.php:47` — With the new `UNIQUE KEY event_user`, a second booking by the same member fails on duplicate key, `$wpdb->query()` returns false, and `if ( 1 !== $inserted )` reports "This event is full." — a wrong message, and on upgraded tables that already contain duplicate rows dbDelta cannot add the index at all, so the guarantee silently does not apply.
- `handoff` — **low** `includes/class-mdir-db.php:100` — `prune_log()` was deleted rather than fixed, so the 30-day cleanup of the mdir_log table is gone; it had no callers, so nothing fatals, but the housekeeping no longer exists and uninstall.php does not drop that table either.
- `handoff` — **low** `includes/class-mdir-rest.php:76` — `/mdir/v1/members` is now unreachable for every role including administrators unless a site adds the `mdir_public_directory` filter — there is no capability fallback such as current_user_can( 'mdir_view_private' ).
- `handoff` — **low** `includes/functions.php:36` — `mdir_member_count()` caches the total for five minutes with no invalidation on user_register/delete_user, so the AJAX and REST headline counts are now stale for up to five minutes after signups.
- `oneshot` — **medium** `includes/class-mdir-directory.php:66` — New per-search cache key `self::CACHE_KEY . '_' . md5( wp_json_encode( array( $term, $page, $per_page ) ) )` is derived from the unvalidated `$_GET['mdir_q']`, so any anonymous visitor can mint unlimited 15-minute `_transient_mdir_directory_html_*` rows in wp_options by varying the query string - the old code had exactly one key.
- `oneshot` — **low** `includes/class-mdir-booking.php:25` — Added `|| 'publish' !== get_post_status( $event_id )` - private, scheduled, draft and password-protected mdir_event posts that were previously bookable now hard-fail with wp_die( 'Unknown event.', 400 ), a user-visible behaviour change not covered by any claim.
- `oneshot` — **low** `includes/class-mdir-db.php:141` — `return (int) $wpdb->query( $wpdb->prepare( $sql, $args ) );` collapses a SQL failure (false) and a legitimate refusal into the same 0, so book_seat() reports 'You already have a seat at this event.' (HTTP 409) when the insert actually errored.
- `oneshot` — **low** `includes/class-mdir-db.php:118` — Public signature changed to `add_booking( $event_id, $user_id, $capacity = null )` and the return value changed from $wpdb->insert()'s result to a row count; with the default null the new `WHERE NOT EXISTS (...)` duplicate guard still applies, so any existing two-arg caller that relied on inserting a repeat booking now silently gets 0.
- `oneshot` — **low** `includes/class-mdir-booking.php:57` — New error code `new WP_Error( 'mdir_booked', ... )` - code that branched only on 'mdir_full' will fall through, and the 'This event is full.' message is now also returned whenever mdir_capacity is unset or 0 via the `if ( $capacity < 1 )` short-circuit at line 48 without ever touching the bookings table.

## Fix rate by severity

| Arm | Run | Critical | High | Medium | Low |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 15/21 | 15/32 | 2/13 | 3/9 |
| `handoff` | matrix-handoff-sonnet | 19/21 | 27/32 | 10/13 | 8/9 |
| `handoff` | matrix-handoff-haiku | 18/21 | 28/32 | 8/13 | 8/9 |
| `handoff-review` | matrix-handoff-review-sonnet | 18/21 | 27/32 | 8/13 | 5/9 |
| `handoff-review` | matrix-handoff-review-haiku | 19/21 | 27/32 | 9/13 | 8/9 |
| `oneshot` | matrix-oneshot-opus | 20/21 | 31/32 | 10/13 | 8/9 |
| `skill` | matrix-skill | 19/21 | 28/32 | 8/13 | 7/9 |
| `handoff` | matrix-handoff-opus | 19/21 | 28/32 | 8/13 | 7/9 |
| `handoff` | hard-handoff-sonnet | 3/3 | 5/5 | 1/1 | - |
| `oneshot` | hard-oneshot-opus | 3/3 | 4/5 | 1/1 | - |

## Fix rate by category

| Arm | Run | accessibility | correctness | i18n | performance | security | wp-standards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 1/3 | 5/11 | 1/1 | 0/4 | 27/44 | 1/12 |
| `handoff` | matrix-handoff-sonnet | 3/3 | 8/11 | 1/1 | 4/4 | 37/44 | 11/12 |
| `handoff` | matrix-handoff-haiku | 2/3 | 8/11 | 1/1 | 4/4 | 37/44 | 10/12 |
| `handoff-review` | matrix-handoff-review-sonnet | 1/3 | 6/11 | 1/1 | 3/4 | 37/44 | 10/12 |
| `handoff-review` | matrix-handoff-review-haiku | 3/3 | 7/11 | 1/1 | 4/4 | 38/44 | 10/12 |
| `oneshot` | matrix-oneshot-opus | 3/3 | 8/11 | 1/1 | 4/4 | 42/44 | 11/12 |
| `skill` | matrix-skill | 2/3 | 8/11 | 1/1 | 4/4 | 39/44 | 8/12 |
| `handoff` | matrix-handoff-opus | 2/3 | 7/11 | 1/1 | 4/4 | 38/44 | 10/12 |
| `handoff` | hard-handoff-sonnet | - | 2/2 | - | - | 7/7 | - |
| `oneshot` | hard-oneshot-opus | - | 2/2 | - | - | 6/7 | - |

## Review recall vs. fixes landed

The gap between what the reviewer found and what the implementer landed is the cost of the handoff.

| Arm | Run | Judge recall | False positives | Fixed | Found→fixed |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | ~35/76 (heur.) | - | 35 | 100% |
| `handoff` | matrix-handoff-sonnet | 64/76 | 2 | 64 | 100% |
| `handoff` | matrix-handoff-haiku | 67/76 | 0 | 62 | 93% |
| `handoff-review` | matrix-handoff-review-sonnet | 64/76 | 1 | 58 | 91% |
| `handoff-review` | matrix-handoff-review-haiku | 66/76 | 0 | 63 | 96% |
| `oneshot` | matrix-oneshot-opus | 66/76 | 0 | 69 | 105% |
| `skill` | matrix-skill | 60/76 | 0 | 62 | 103% |
| `handoff` | matrix-handoff-opus | 66/76 | 0 | 62 | 94% |
| `handoff` | hard-handoff-sonnet | 10/10 | 0 | 9 | 90% |
| `oneshot` | hard-oneshot-opus | 9/10 | 0 | 8 | 89% |

## Tokens and context, per phase

| Arm | Phase | Model | Turns | Tools | Output | Cache read | Billed in | Total | Cost | Peak context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | review | haiku | 22 | 21 | 18,655 | 293,296 | 333,877 | 352,532 | $0.204 | 54,204 (27%) |
| `handoff` | fix | haiku | 53 | 52 | 24,072 | 2,695,948 | 2,753,879 | 2,777,951 | $0.505 | 71,202 (36%) |
| `handoff` | verify | - | 9 | 8 | 22,724 | 322,959 | 394,731 | 417,455 | $1.447 | 81,878 (8%) |
| `handoff` | review | opus | 11 | 10 | 53,927 | 454,160 | 538,617 | 592,544 | $2.420 | 94,555 (9%) |
| `handoff` | fix | sonnet | 6 | 5 | 18,524 | 320,850 | 389,161 | 407,685 | $0.523 | 78,522 (8%) |
| `handoff` | verify | - | 13 | 12 | 27,958 | 703,159 | 796,501 | 824,459 | $1.984 | 103,436 (10%) |
| `handoff` | review | opus | 11 | 10 | 44,203 | 448,191 | 521,712 | 565,915 | $2.064 | 83,619 (8%) |
| `handoff` | fix | haiku | 53 | 52 | 36,883 | 3,441,841 | 3,520,737 | 3,557,620 | $0.686 | 92,167 (46%) |
| `handoff` | verify | - | 15 | 14 | 33,003 | 964,712 | 1,066,190 | 1,099,193 | $2.322 | 111,568 (11%) |
| `handoff-review` | review | opus | 9 | 8 | 50,406 | 366,316 | 445,928 | 496,334 | $2.239 | 89,714 (9%) |
| `handoff-review` | fix | sonnet | 7 | 6 | 26,364 | 414,605 | 492,766 | 519,130 | $0.659 | 88,370 (9%) |
| `handoff-review` | verify | - | 17 | 16 | 32,620 | 715,484 | 814,281 | 846,901 | $2.161 | 108,893 (11%) |
| `handoff-review` | review | opus | 14 | 13 | 55,801 | 697,568 | 787,182 | 842,983 | $2.640 | 99,706 (10%) |
| `handoff-review` | fix | haiku | 45 | 40 | 29,442 | 2,671,762 | 2,744,047 | 2,773,489 | $0.590 | 87,812 (44%) |
| `handoff-review` | verify | - | 14 | 13 | 25,789 | 786,135 | 877,222 | 903,011 | $1.949 | 101,179 (10%) |
| `oneshot` | oneshot | opus | 21 | 20 | 54,229 | 1,351,093 | 1,436,515 | 1,490,744 | $2.885 | 95,500 (10%) |
| `oneshot` | verify | - | 16 | 15 | 33,103 | 667,681 | 776,815 | 809,918 | $2.253 | 119,232 (12%) |
| `skill` | skill | opus | 23 | 62 | 18,128 | 1,004,578 | 1,059,232 | 1,077,360 | $4.243 | 90,067 (9%) |
| `skill` | verify | - | 14 | 13 | 27,202 | 802,470 | 893,289 | 920,491 | $1.989 | 100,911 (10%) |
| `handoff` | review | opus | 16 | 15 | 61,406 | 992,014 | 1,086,726 | 1,148,132 | $2.978 | 104,800 (10%) |
| `handoff` | fix | opus | 20 | 19 | 34,640 | 1,459,712 | 1,547,867 | 1,582,507 | $2.477 | 98,235 (10%) |
| `handoff` | verify | - | 17 | 16 | 31,227 | 681,227 | 781,617 | 812,844 | $2.125 | 110,486 (11%) |
| `handoff` | review | opus | 10 | 9 | 30,254 | 489,022 | 548,500 | 578,754 | $1.596 | 69,574 (7%) |
| `handoff` | fix | sonnet | 5 | 4 | 7,667 | 193,599 | 237,626 | 245,293 | $0.291 | 54,240 (5%) |
| `handoff` | verify | - | 6 | 5 | 14,534 | 204,409 | 256,942 | 271,476 | $0.991 | 62,641 (6%) |
| `oneshot` | oneshot | opus | 14 | 13 | 31,511 | 684,221 | 745,127 | 776,638 | $1.739 | 70,998 (7%) |
| `oneshot` | verify | - | 8 | 7 | 15,487 | 313,506 | 369,595 | 385,082 | $1.105 | 66,193 (7%) |

## Where the handoff leaked

Defects the reviewer was looking at but the code still exhibits afterwards.


**`handoff` / smoke-handoff** — 40 still open:

```
WP-01 WP-02 DEF-01 BUG-01 WP-03 DBG-01 SEC-04 SEC-05 TZ-01 SEC-06 SEC-10 SEC-12 PERF-01 WP-04 SEC-16 SEC-17 SEC-18 SEC-19 SEC-22 SEC-25 WP-05 SEC-30 WP-06 PERF-02 BUG-05 PERF-04 PERF-05 BUG-06 BUG-07 SEC-35 SEC-36 A11Y-02 SEC-40 A11Y-03 DEF-02 WP-08 JS-02 JS-03 JS-05 JS-07
```

**`handoff` / matrix-handoff-sonnet** — 11 still open:

```
WP-02 BUG-02 SEC-02 SEC-03 SEC-27 SEC-31 BUG-05 SEC-35 SEC-38 JS-04 JS-07
```

**`handoff` / matrix-handoff-haiku** — 13 still open:

```
WP-02 WP-03 BUG-02 SEC-02 SEC-03 SEC-04 SEC-27 BUG-04 BUG-05 SEC-35 SEC-38 SEC-40 A11Y-03
```

**`handoff-review` / matrix-handoff-review-sonnet** — 17 still open:

```
WP-02 BUG-02 SEC-02 SEC-03 TZ-01 SEC-27 BUG-05 PERF-04 BUG-07 SEC-35 A11Y-02 SEC-38 SEC-39 SEC-40 A11Y-03 DEF-02 JS-04
```

**`handoff-review` / matrix-handoff-review-haiku** — 12 still open:

```
WP-02 WP-03 BUG-02 SEC-02 SEC-03 SEC-27 BUG-04 BUG-05 SEC-35 SEC-38 SEC-39 JS-04
```

**`oneshot` / matrix-oneshot-opus** — 6 still open:

```
WP-02 BUG-02 SEC-02 SEC-27 BUG-05 JS-04
```

**`skill` / matrix-skill** — 13 still open:

```
WP-02 WP-03 BUG-02 SEC-02 WP-04 SEC-27 BUG-05 SEC-38 SEC-39 SEC-40 A11Y-03 DEF-02 JS-04
```

**`handoff` / matrix-handoff-opus** — 13 still open:

```
WP-02 WP-03 BUG-02 SEC-02 SEC-03 SEC-04 SEC-27 SEC-31 BUG-04 BUG-05 SEC-38 A11Y-03 JS-04
```

**`handoff` / hard-handoff-sonnet** — 0 still open:

```
(none)
```

**`oneshot` / hard-oneshot-opus** — 1 still open:

```
H-07
```

## Raw data

- `results/runs.jsonl` — one JSON object per run, the source of truth.
- `results/results.csv` — one row per run.
- `results/phases.csv` — one row per phase, with the per-turn context series.
- `runs/<name>/` — transcripts (`*.jsonl`), `REVIEW.md`, `PLAN.md`, `IMPLEMENTATION.md`, `fix.diff`.

