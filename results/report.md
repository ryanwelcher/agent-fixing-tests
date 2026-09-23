# Two-model review handoff: results

_Generated 2026-09-23 19:28 from 12 run(s) in `results/runs.jsonl` (13 superseded row(s) ignored)._

Fixture: `wp-event-manager`, a WordPress plugin with 76 deliberately seeded defects
(22 critical, 32 high, 13 medium, 9 low). 75 are checked by deterministic regex detectors;
one is graded by hand. Fix rate is measured on the code, not claimed by the model.

## Headline

Two fix rates. **Detector** is the optimistic one: the broken pattern is gone and a
plausible API appears. **Verified** is the honest one: a judge read the code and confirmed
the defect is actually gone. Quote the verified number.

| Arm | Reviewer | Implementer | Detector | Verified | Verified rate | Cost | Tokens | Wall | Cost/verified fix | Surface | Lint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | haiku | 35/75 | 31/75 | 41% | $0.709 | 3,130,483 | 9m02s | $0.023 | intact | pass |
| `handoff` | opus | sonnet | 64/75 | 56/75 | 75% | $2.942 | 1,000,229 | 14m53s | $0.053 | intact | pass |
| `handoff` | opus | haiku | 62/75 | 54/75 | 72% | $2.750 | 4,123,535 | 18m26s | $0.051 | intact | pass |
| `handoff-review` | opus | sonnet | 58/75 | 53/75 | 71% | $2.899 | 1,015,464 | 15m05s | $0.055 | intact | pass |
| `handoff-review` | opus | haiku | 63/75 | 57/75 | 76% | $3.230 | 3,616,472 | 16m24s | $0.057 | intact | pass |
| `oneshot` | opus | opus | 69/75 | 65/75 | 87% | $2.885 | 1,490,744 | 11m52s | $0.044 | intact | pass |
| `skill` | opus | sonnet | 58/75 | 54/75 | 72% | $3.766 | 928,721 | 15m51s | $0.070 | intact | pass |
| `handoff` | opus | opus | 62/75 | 56/75 | 75% | $5.455 | 2,730,639 | 18m33s | $0.097 | intact | pass |
| `handoff` | opus | sonnet | 9/9 | 9/9 | 100% | $1.887 | 824,047 | 11m11s | $0.210 | - | pass |
| `oneshot` | opus | opus | 8/9 | 8/9 | 89% | $1.739 | 776,638 | 9m09s | $0.217 | - | pass |
| `handoff` | opus | opus | 60/75 | 55/75 | 73% | $3.182 | 1,179,258 | 13m17s | $0.058 | intact | pass |
| `oneshot` | opus | opus | 59/75 | 54/75 | 72% | $1.869 | 1,086,286 | 9m20s | $0.035 | intact | pass |

## Fix quality

Of the fixes the detectors passed, how many survive reading the code.

| Arm | Implementer | Correct | Superficial | Removed feature | Uncertain | Regressions introduced | Detector overstated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | 31 | 4 | 0 | 0 | 10 | 11% |
| `handoff` | sonnet | 56 | 6 | 2 | 0 | 8 | 13% |
| `handoff` | haiku | 54 | 6 | 2 | 0 | 14 | 13% |
| `handoff-review` | sonnet | 53 | 5 | 0 | 0 | 9 | 9% |
| `handoff-review` | haiku | 57 | 5 | 1 | 0 | 4 | 10% |
| `oneshot` | opus | 65 | 4 | 0 | 0 | 6 | 6% |
| `skill` | sonnet | 54 | 3 | 1 | 0 | 6 | 7% |
| `handoff` | opus | 56 | 5 | 1 | 0 | 6 | 10% |
| `handoff` | sonnet | 9 | 0 | 0 | 0 | 6 | 0% |
| `oneshot` | opus | 8 | 0 | 0 | 0 | 5 | 0% |
| `handoff` | opus | 55 | 4 | 1 | 0 | 4 | 8% |
| `oneshot` | opus | 54 | 5 | 0 | 0 | 5 | 8% |

### Regressions the fix introduced

- `handoff` — **high** `plugin/includes/class-event-admin.php:32` — 'custom_css' => wp_kses_allowed_html( $_POST[...]['custom_css'], 'post' ) stores the kses allowed-tags ARRAY instead of the CSS. Every settings save destroys custom CSS, and styles() / the settings textarea then echo an array ('Array' plus an Array-to-string warning on every front-end page).
- `handoff` — **high** `plugin/public/js/frontend.js:11` — nonce: jQuery('#wpem-nonce').val() reads an element that does not exist; wp_nonce_field('wpem_rsvp_nonce','nonce') renders id="nonce". check_ajax_referer therefore fails and every front-end RSVP is rejected with -1.
- `handoff` — **medium** `plugin/includes/class-event-admin.php:37` — wp_redirect() was replaced with wp_safe_remote_get( admin_url(...) ). That is a server-side loopback HTTP request, not a redirect: the POST is never redirected (form resubmits on refresh) and every save fires a useless outbound request.
- `handoff` — **medium** `plugin/admin/js/admin.js:5` — nonce: jQuery('#wpem-delete-rsvp-nonce').val() reads an element no PHP code outputs, so RSVP deletion always fails the nonce check.
- `handoff` — **medium** `plugin/public/js/frontend.js:29` — '&nonce=' + jQuery('#wpem-search-nonce').val() reads an element that is never rendered, and the handler now also requires manage_options, so the public #wpem-search box always returns -1.
- `handoff` — **medium** `plugin/includes/class-event-admin.php:68` — check_admin_referer( 'wpem_export_nonce', 'wpem_nonce' ) is added, but nothing in the plugin generates an export URL with that nonce, so the CSV export can no longer be used at all.
- `handoff` — **low** `plugin/includes/class-event-cpt.php:40` — current_user_can( 'edit_posts' ) || wp_die() inside a save_post callback kills any request that saves an event on behalf of a user without edit_posts (e.g. front-end or programmatic inserts). It also checks the generic cap instead of edit_post for $post_id, and there is no meta-box nonce.
- `handoff` — **low** `plugin/includes/class-event-admin.php:97` — The import type check relies on the client-supplied $file['type'] with a strict text/csv|text/plain allowlist. Browsers that send application/vnd.ms-excel for .csv (common on Windows) are rejected, and the check is trivially spoofable.
- `handoff` — **low** `plugin/includes/functions.php:41` — wpem_remote_events() now expects JSON instead of PHP-serialized data, so any existing endpoint that returns serialized data silently yields array().
- `handoff` — **low** `plugin/includes/functions.php:47` — wpem_current_url() now always returns the settings-page admin URL instead of the current request URL, which changes behaviour for any caller.
- `handoff` — **medium** `plugin/includes/class-event-admin.php:84` — Meta box date field changed to type="datetime-local"; existing values stored as 'Y-m-d H:i' (space, not 'T') are invalid for that input, so the browser shows it blank and the next save writes '' over the event date (isset( $_POST['wpem_date'] ) is true).
- `handoff` — **medium** `plugin/includes/class-event-cron.php:17` — Cleanup now fetches only the first 100 published events with a date (default order: newest post first) and filters past dates in PHP; on sites with 100+ current events, older past events are never reached and never cleaned up.
- `handoff` — **medium** `plugin/includes/class-event-admin.php:123` — export() now requires check_admin_referer( 'wpem_export' ), but no code anywhere emits a wp_nonce_url/nonce for admin-post.php?action=wpem_export, so the CSV export can no longer be used by anyone, admins included.
- `handoff` — **low** `plugin/includes/class-event-admin.php:54` — Price saved as (float) wp_unslash( $_POST['wpem_price'] ): inputs like '$10' or 'Free' silently become 0.
- `handoff` — **low** `plugin/uninstall.php:20` — 'post_status' => 'any' leaves out 'trash', and cleanup now trashes past events (wp_trash_post), so those trashed events are left behind after uninstall.
- `handoff` — **low** `plugin/includes/class-event-shortcode.php:11` — The shortcode's 'category' attribute was dropped from shortcode_atts, so an existing [events category="..."] silently ignores it and lists all events.
- `handoff` — **low** `plugin/includes/class-event-db.php:10` — Sorting by ?orderby= is gone: callers (export, REST attendees) never pass $orderby, so results always sort by created DESC.
- `handoff` — **low** `plugin/public/js/frontend.js:22` — The public #wpem-search handler was removed and the nopriv search hook deleted; the replacement in admin.js only loads on the settings page, which has no #wpem-search or #wpem-results element, so search has no working UI anywhere.
- `handoff` — **high** `plugin/includes/class-event-db.php:11` — Every query now targets `$wpdb->prefix . 'wpem_rsvps'`, but the table is only created and migrated in wpem_activate(). An in-place plugin update does not fire activation, and wpem_db_version is written but never checked, so existing sites lose all RSVPs and get DB errors until reactivation.
- `handoff` — **medium** `plugin/includes/class-event-cpt.php:63` — `gmdate( 'Y-m-d H:i:s', strtotime( ... ) )` stores the admin's local wall-clock time as if it were UTC, and format_event_date() now renders it through wp_date() in the site timezone. Displayed event times shift by the site's UTC offset.
- `handoff` — **medium** `plugin/public/js/frontend.js:24` — Front-end search sends `nonce: wpemData.nonce` (action 'wpem_rsvp') but the handler runs `check_ajax_referer( 'wpem_admin', 'nonce' )` (class-event-ajax.php:71) and is now logged-in/edit_posts only. Front-end search always fails, and line 30 discards the results anyway (`resultsEl.innerHTML = '';`).
- `handoff` — **medium** `plugin/includes/class-event-shortcode.php:79` — `esc_html( wp_strip_all_tags( $css ) )` inside <style> turns quotes and `>` into entities, so valid custom CSS such as `font-family: "Open Sans"` or `ul > li` breaks.
- `handoff` — **medium** `plugin/includes/class-event-rest.php:99` — GET /events changed from all events to 10 by default, and sends no X-WP-Total/X-WP-TotalPages headers. Existing clients silently receive a truncated list and cannot discover more pages.
- `handoff` — **medium** `plugin/includes/class-event-rest.php:144` — `$raw = $request->get_json_params();` ignores form-encoded or query params. Such requests change nothing yet still return `{ saved: true }`.
- `handoff` — **medium** `plugin/uninstall.php:22` — Pages with `'paged' => $paged` while deleting the previous page, so the offset skips the rows that shifted up. Sites with more than 200 events are left with undeleted events after uninstall.
- `handoff` — **low** `plugin/includes/class-event-cron.php:22` — Same paged-while-trashing pattern: trashed events drop out of the 'publish' set, so each run skips some expired events.
- `handoff` — **low** `plugin/includes/class-event-cron.php:43` — Cleanup no longer deletes RSVPs. When trash is emptied, wp_delete_post never touches the custom table, which leaves orphaned attendee name/email rows forever.
- `handoff` — **low** `plugin/wp-event-manager.php:57` — `INSERT INTO {$new_table} SELECT * FROM wpem_rsvps` copies the shared unprefixed table into every site/install that activates, including other installs' RSVPs. Duplicate ids fail silently and the legacy table is never dropped (uninstall ignores it).
- `handoff` — **low** `plugin/wp-event-manager.php:46` — `PRIMARY KEY (id),` has one space. dbDelta requires two, so every re-activation tries to re-add the primary key and logs a DB error.
- `handoff` — **low** `plugin/includes/class-event-admin.php:101` — `in_array( $value[0], ...)` on an empty name/email/status raises an 'Uninitialized string offset 0' warning in the CSV export.
- `handoff` — **low** `plugin/includes/class-event-rest.php:134` — POST /rsvp response changed from a bare integer id to `{ id: n }`. The AJAX rsvp response also moved the id to `data.id`, which breaks existing API consumers.
- `handoff` — **low** `plugin/uninstall.php:9` — The removed `delete_option( 'wpem_visits' )` means upgraded sites keep that option after uninstall. The new `wpem_migrated_to_prefix` option is never deleted either.
- `handoff-review` — **high** `plugin/includes/class-event-db.php:10` — Table renamed from 'wpem_rsvps' to $wpdb->prefix.'wpem_rsvps' with no upgrade/migration path: activation hook doesn't run on plugin update and 'wpem_db_version' is written but never checked, so on existing installs every RSVP query hits a non-existent table and existing RSVP data is orphaned in the old table.
- `handoff-review` — **medium** `plugin/includes/class-event-cron.php:41` — cleanup() get_posts( 'post_status' => 'publish', 'posts_per_page' => 100 ) orders by post date DESC with no meta/date filter, so on sites with >100 published events, expired events outside the newest 100 are never cleaned up.
- `handoff-review` — **medium** `plugin/includes/class-event-ajax.php:17` — Anonymous RSVP now requires check_ajax_referer( 'wpem_rsvp', 'nonce' ) with a nonce localized into the page; on full-page-cached sites the cached nonce expires (12-24h) and every visitor RSVP fails with -1/403.
- `handoff-review` — **low** `plugin/public/js/frontend.js:24` — Public '#wpem-search' attendee search removed from frontend and moved to admin.js, but no admin screen renders #wpem-search/#wpem-results markup, so the search UI is now dead code everywhere (visible behaviour change for sites that used it).
- `handoff-review` — **low** `plugin/includes/functions.php:36` — wpem_current_url() now returns home_url( $wp->request ); in wp-admin $wp->request is empty, so the settings page 'Current page:' line shows the site home URL instead of the current page, and query strings are dropped.
- `handoff-review` — **low** `plugin/uninstall.php:22` — Uninstall loop queries 'post_status' => 'any', which excludes 'trash'; since cron now trashes expired events, those trashed events survive uninstall. The do/while also loops forever if wp_delete_post() ever fails for a returned ID.
- `handoff-review` — **low** `plugin/includes/class-event-cpt.php:26` — 'show_in_rest' => true added to the event CPT: switches event editing to the block editor and exposes events at /wp/v2/event, an unrequested behaviour change.
- `handoff-review` — **low** `plugin/includes/class-event-cron.php:21` — track_visit() now buffers in a transient and flushes every 20 hits (non-atomic, lost if the transient expires); the wpem_visits count is now approximate and lags.
- `handoff-review` — **low** `plugin/templates` — diff reports 'Only in plugin: templates' - the templates/ directory was deleted without showing its contents; nothing in the current code references it, but any site/theme overriding or including those templates would break.
- `handoff-review` — **medium** `plugin/public/js/frontend.js:25` — Front-end search is now dead for everyone. It sends 'nonce: wpemFront.nonce' (action 'wpem_frontend'), but the handler runs check_ajax_referer( 'wpem_admin', 'nonce' ) (class-event-ajax.php:65) and needs manage_options, and the nopriv hook is gone. So every request returns -1 or 403, admins included.
- `handoff-review` — **medium** `plugin/includes/class-event-cron.php:16` — Cleanup now handles only the first 100 events ('posts_per_page' => 100, default order post_date DESC) and does not filter by event date. On sites with more than 100 events, the older past events are never reached, so they are never cleaned up.
- `handoff-review` — **low** `plugin/uninstall.php:17` — do/while re-queries get_posts until it comes back empty. If wp_delete_post() fails for any post, the same IDs come back every time and uninstall loops forever. Trashed events are also skipped, because 'any' excludes trash.
- `handoff-review` — **low** `plugin/templates/event-single.php:23` — The currency symbol was dropped. The old 'Price: $<?php echo $price; ?>' is now 'Price: %s', so visitors see 'Price: 20' instead of 'Price: $20'.
- `oneshot` — **medium** `plugin/includes/class-event-cron.php:37` — cleanup() always fetches the same first 100 published events (`'numberposts' => self::CLEANUP_BATCH`, no date filter/offset); once >100 upcoming events exist, older past events are never reached, so cleanup silently stops working.
- `oneshot` — **medium** `plugin/uninstall.php:25` — `'post_status' => 'any'` excludes trash, and the fix switched cron to `wp_trash_post()`, so every auto-trashed event is left behind after uninstall; also if wp_delete_post() fails for a full batch the do/while re-fetches the same 200 IDs forever.
- `oneshot` — **low** `plugin/includes/class-event-ajax.php:82` — wpem_search is now manage_options-only (nopriv hook removed) but public/js/frontend.js:24 still calls it from the front end, so the visitor-facing search always returns 403 - a user-visible feature silently broken rather than restricted in the UI.
- `oneshot` — **low** `plugin/includes/class-event-rest.php:161` — POST /wpem/v1/rsvp response changed from a bare integer (`return WPEM_DB::add_rsvp(...)`) to `{ "id": n }` and now 400s for non-published events - breaking change for existing API clients.
- `oneshot` — **low** `plugin/includes/class-event-ajax.php:23` — `check_ajax_referer( 'wpem_ajax', 'nonce' )` on the nopriv RSVP handler: logged-out nonces embedded in full-page-cached event pages expire after 12-24h, after which every anonymous RSVP fails with -1/403.
- `oneshot` — **low** `plugin/includes/class-event-db.php:68` — `created` now stored as UTC (`current_time( 'mysql', true )`) where it used to be server-local NOW(); existing rows and new rows are on different clocks, affecting ORDER BY created and any display.
- `skill` — **high** `plugin/includes/class-event-db.php:10` — Table renamed from 'wpem_rsvps' to "$wpdb->prefix . 'wpem_rsvps'" with no upgrade routine. The activation hook does not run on plugin update, so existing installs query a missing table, and every existing RSVP is orphaned in the old table.
- `skill` — **low** `plugin/uninstall.php:11` — "DROP TABLE IF EXISTS ' . $wpdb->prefix . 'wpem_rsvps'" never drops the legacy unprefixed wpem_rsvps table that existing installs created, so attendee PII is left behind after uninstall.
- `skill` — **medium** `plugin/wp-event-manager.php:83` — Front-end search now only works for admins: "'searchNonce' => current_user_can( 'manage_options' ) ? wp_create_nonce( 'wpem_search' ) : ''" and the nopriv hook is removed, so the public #wpem-search box in frontend.js silently returns -1/403 for visitors. This is an intended PII fix, but users will see the behaviour change.
- `skill` — **low** `plugin/includes/class-event-cpt.php:26` — New "'taxonomies' => array( 'category' )" attaches core categories to the event CPT, which changes the admin UI and category counts.
- `skill` — **low** `plugin/templates/event-single.php:4` — "isset( $_GET['event_id'] ) ? absint( $_GET['event_id'] ) : get_the_ID()": a non-numeric event_id gives 0, get_post(0) falls back to the global post and passes the type check, but meta and attendees are then looked up for ID 0 and render empty.
- `skill` — **low** `plugin/includes/class-event-admin.php:162` — CSV import calls WPEM_DB::add_rsvp() directly, bypassing the new has_rsvp() duplicate check in wpem_create_rsvp(), so re-importing a file duplicates rows even though the AJAX/REST paths now reject duplicates.
- `handoff` — **high** `plugin/wp-event-manager.php:47` — Table renamed from unprefixed `wpem_rsvps` to `$wpdb->prefix . 'wpem_rsvps'` with no migration. Existing RSVPs are orphaned on upgrade (the new table is only created on reactivation, so until then every query fails), and uninstall.php no longer drops the old table.
- `handoff` — **medium** `plugin/includes/class-event-shortcode.php:62` — format_event_date( strtotime( (string) $date ) ) now goes through wp_date(). strtotime() parses the site-local datetime-local value as UTC, so every displayed event time is shifted by the site's UTC offset. The old date() showed the entered time.
- `handoff` — **low** `plugin/public/js/frontend.js:28` — The front-end search handler references `wpemAdmin.ajaxUrl`, but wpemAdmin is only localized on admin screens. On the front end this throws a ReferenceError on keyup, so public search is silently broken (the nopriv search endpoint was also removed).
- `handoff` — **low** `plugin/includes/class-event-shortcode.php:14` — The shortcode's `event_search` feature ('Showing results for: ...') was removed without mention. Users of ?event_search lose that behaviour.
- `handoff` — **low** `plugin/templates/event-single.php:18` — wp_kses_post( apply_filters( 'the_content', ... ) ) strips the <iframe> that oEmbed produces, so embedded videos and maps in event content disappear.
- `handoff` — **low** `plugin/includes/class-event-cron.php:14` — Cleanup fetches any 100 events with no date filter or ordering. With more than 100 future events, past events may never be reached.
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
- `handoff` — **medium** `includes/class-event-cron.php:25` — cleanup() now takes only the first 200 published events in default post_date order ('posts_per_page' => 200) with no ordering by event date; on sites with more than 200 dated events, past events outside that window are never cleaned up. fields=>ids also skips meta priming, so each event triggers its own get_post_meta query.
- `handoff` — **low** `includes/class-event-ajax.php:11` — wp_ajax_nopriv_wpem_search was removed and search() now requires manage_options, but wpem_frontend_assets() still sends a search nonce to every visitor and frontend.js still binds #wpem-search. Public attendee search now fails for everyone except admins (intended for PII, but a user-visible change).
- `handoff` — **low** `includes/class-event-rest.php:18` — GET /wpem/v1/events used to return every event. It now silently caps at 'per_page' default 100, and 'no_found_rows' => true means callers get no total, so existing clients see truncated lists.
- `handoff` — **low** `includes/functions.php:66` — wpem_sanitize_settings() replaces a blank or invalid notify_email with get_option('admin_email'), so admins can no longer turn off RSVP notification emails by clearing the field.
- `oneshot` — **medium** `plugin/public/js/frontend.js:21` — Front-end attendee search is now broken for visitors: wp_ajax_nopriv_wpem_search was removed and search() returns wp_die('-1',403) unless manage_options, yet frontend.js still calls action 'wpem_search' and writes the '-1' response into #wpem-results via innerHTML.
- `oneshot` — **medium** `plugin/includes/class-event-rest.php:24` — GET /wpem/v1/events used to return all events. It now silently returns at most 100 ('per_page' default 100, maximum 100) with 'no_found_rows' => true, so there is no X-WP-Total/X-WP-TotalPages and clients can't tell the list was truncated.
- `oneshot` — **low** `plugin/includes/class-event-ajax.php:22` — Failed RSVPs now get wp_send_json( array('success'=>false), 400 ). jQuery routes that to the error path, and frontend.js has no error handler, so the user sees no feedback.
- `oneshot` — **low** `plugin/wp-event-manager.php:73` — The legacy-table migration renames the shared unprefixed 'wpem_rsvps' only when is_main_site(). On multisite all existing RSVPs from every subsite end up in the main site's table, and subsites start empty.
- `oneshot` — **low** `plugin/includes/class-event-admin.php:89` — Export now requires a POST nonce (check_admin_referer('wpem_export')). Existing export links or bookmarks (admin-post.php?action=wpem_export&event_id=N) now fail with 'link expired'. This is intended, but users will notice.

## Fix rate by severity

| Arm | Run | Critical | High | Medium | Low |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 15/21 | 15/32 | 2/13 | 3/9 |
| `handoff` | matrix-handoff-sonnet | 19/21 | 27/32 | 10/13 | 8/9 |
| `handoff` | matrix-handoff-haiku | 18/21 | 28/32 | 8/13 | 8/9 |
| `handoff-review` | matrix-handoff-review-sonnet | 18/21 | 27/32 | 8/13 | 5/9 |
| `handoff-review` | matrix-handoff-review-haiku | 19/21 | 27/32 | 9/13 | 8/9 |
| `oneshot` | matrix-oneshot-opus | 20/21 | 31/32 | 10/13 | 8/9 |
| `skill` | matrix-skill | 18/21 | 27/32 | 9/13 | 4/9 |
| `handoff` | matrix-handoff-opus | 19/21 | 28/32 | 8/13 | 7/9 |
| `handoff` | hard-handoff-sonnet | 3/3 | 5/5 | 1/1 | - |
| `oneshot` | hard-oneshot-opus | 3/3 | 4/5 | 1/1 | - |
| `handoff` | repeat-handoff-opus | 20/21 | 27/32 | 8/13 | 5/9 |
| `oneshot` | repeat-oneshot-opus | 18/21 | 27/32 | 9/13 | 5/9 |

## Fix rate by category

| Arm | Run | accessibility | correctness | i18n | performance | security | wp-standards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 1/3 | 5/11 | 1/1 | 0/4 | 27/44 | 1/12 |
| `handoff` | matrix-handoff-sonnet | 3/3 | 8/11 | 1/1 | 4/4 | 37/44 | 11/12 |
| `handoff` | matrix-handoff-haiku | 2/3 | 8/11 | 1/1 | 4/4 | 37/44 | 10/12 |
| `handoff-review` | matrix-handoff-review-sonnet | 1/3 | 6/11 | 1/1 | 3/4 | 37/44 | 10/12 |
| `handoff-review` | matrix-handoff-review-haiku | 3/3 | 7/11 | 1/1 | 4/4 | 38/44 | 10/12 |
| `oneshot` | matrix-oneshot-opus | 3/3 | 8/11 | 1/1 | 4/4 | 42/44 | 11/12 |
| `skill` | matrix-skill | 2/3 | 6/11 | 1/1 | 4/4 | 37/44 | 8/12 |
| `handoff` | matrix-handoff-opus | 2/3 | 7/11 | 1/1 | 4/4 | 38/44 | 10/12 |
| `handoff` | hard-handoff-sonnet | - | 2/2 | - | - | 7/7 | - |
| `oneshot` | hard-oneshot-opus | - | 2/2 | - | - | 6/7 | - |
| `handoff` | repeat-handoff-opus | 2/3 | 7/11 | 1/1 | 4/4 | 38/44 | 8/12 |
| `oneshot` | repeat-oneshot-opus | 2/3 | 7/11 | 1/1 | 4/4 | 37/44 | 8/12 |

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
| `skill` | matrix-skill | 65/76 | 0 | 58 | 89% |
| `handoff` | matrix-handoff-opus | 66/76 | 0 | 62 | 94% |
| `handoff` | hard-handoff-sonnet | 10/10 | 0 | 9 | 90% |
| `oneshot` | hard-oneshot-opus | 9/10 | 0 | 8 | 89% |
| `handoff` | repeat-handoff-opus | 65/76 | 0 | 60 | 92% |
| `oneshot` | repeat-oneshot-opus | 67/76 | 0 | 59 | 88% |

## Tokens and context, per phase

| Arm | Phase | Model | Turns | Tools | Output | Cache read | Billed in | Total | Cost | Peak context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | review | haiku | 22 | 21 | 18,655 | 293,296 | 333,877 | 352,532 | $0.204 | 54,204 (27%) |
| `handoff` | fix | haiku | 53 | 52 | 24,072 | 2,695,948 | 2,753,879 | 2,777,951 | $0.505 | 71,202 (36%) |
| `handoff` | verify | - | 6 | 5 | 10,287 | 223,895 | 280,118 | 290,405 | $0.700 | 66,331 (7%) |
| `handoff` | review | opus | 11 | 10 | 53,927 | 454,160 | 538,617 | 592,544 | $2.420 | 94,555 (9%) |
| `handoff` | fix | sonnet | 6 | 5 | 18,524 | 320,850 | 389,161 | 407,685 | $0.523 | 78,522 (8%) |
| `handoff` | verify | - | 10 | 8 | 12,344 | 423,872 | 489,951 | 502,295 | $0.929 | 82,901 (8%) |
| `handoff` | review | opus | 11 | 10 | 44,203 | 448,191 | 521,712 | 565,915 | $2.064 | 83,619 (8%) |
| `handoff` | fix | haiku | 53 | 52 | 36,883 | 3,441,841 | 3,520,737 | 3,557,620 | $0.686 | 92,167 (46%) |
| `handoff` | verify | - | 10 | 8 | 20,970 | 281,374 | 366,331 | 387,301 | $1.272 | 95,065 (10%) |
| `handoff-review` | review | opus | 9 | 8 | 50,406 | 366,316 | 445,928 | 496,334 | $2.239 | 89,714 (9%) |
| `handoff-review` | fix | sonnet | 7 | 6 | 26,364 | 414,605 | 492,766 | 519,130 | $0.659 | 88,370 (9%) |
| `handoff-review` | verify | - | 10 | 9 | 14,619 | 427,252 | 490,919 | 505,538 | $0.887 | 73,769 (7%) |
| `handoff-review` | review | opus | 14 | 13 | 55,801 | 697,568 | 787,182 | 842,983 | $2.640 | 99,706 (10%) |
| `handoff-review` | fix | haiku | 45 | 40 | 29,442 | 2,671,762 | 2,744,047 | 2,773,489 | $0.590 | 87,812 (44%) |
| `handoff-review` | verify | - | 8 | 7 | 9,628 | 378,611 | 435,369 | 444,997 | $0.722 | 66,860 (7%) |
| `oneshot` | oneshot | opus | 21 | 20 | 54,229 | 1,351,093 | 1,436,515 | 1,490,744 | $2.885 | 95,500 (10%) |
| `oneshot` | verify | - | 12 | 11 | 10,690 | 660,757 | 722,223 | 732,913 | $0.838 | 71,560 (7%) |
| `skill` | skill | opus | 18 | 56 | 12,891 | 828,366 | 915,830 | 928,721 | $3.766 | 97,550 (10%) |
| `skill` | verify | - | 10 | 9 | 10,716 | 344,263 | 421,848 | 432,564 | $0.904 | 87,691 (9%) |
| `handoff` | review | opus | 16 | 15 | 61,406 | 992,014 | 1,086,726 | 1,148,132 | $2.978 | 104,800 (10%) |
| `handoff` | fix | opus | 20 | 19 | 34,640 | 1,459,712 | 1,547,867 | 1,582,507 | $2.477 | 98,235 (10%) |
| `handoff` | verify | - | 9 | 8 | 11,604 | 393,381 | 452,229 | 463,833 | $0.781 | 68,950 (7%) |
| `handoff` | review | opus | 10 | 9 | 30,254 | 489,022 | 548,500 | 578,754 | $1.596 | 69,574 (7%) |
| `handoff` | fix | sonnet | 5 | 4 | 7,667 | 193,599 | 237,626 | 245,293 | $0.291 | 54,240 (5%) |
| `handoff` | verify | - | 6 | 5 | 14,534 | 204,409 | 256,942 | 271,476 | $0.991 | 62,641 (6%) |
| `oneshot` | oneshot | opus | 14 | 13 | 31,511 | 684,221 | 745,127 | 776,638 | $1.739 | 70,998 (7%) |
| `oneshot` | verify | - | 8 | 7 | 15,487 | 313,506 | 369,595 | 385,082 | $1.105 | 66,193 (7%) |
| `handoff` | review | opus | 9 | 8 | 54,659 | 455,188 | 543,479 | 598,138 | $1.890 | 98,393 (10%) |
| `handoff` | fix | opus | 21 | 20 | 29,041 | 475,104 | 552,079 | 581,120 | $1.292 | 87,079 (9%) |
| `handoff` | verify | - | 10 | 9 | 13,715 | 351,078 | 425,667 | 439,382 | $0.941 | 84,695 (8%) |
| `oneshot` | oneshot | opus | 26 | 25 | 49,871 | 951,246 | 1,036,415 | 1,086,286 | $1.869 | 95,257 (10%) |
| `oneshot` | verify | - | 8 | 7 | 14,483 | 267,862 | 342,459 | 356,942 | $0.940 | 84,705 (8%) |

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

**`skill` / matrix-skill** — 17 still open:

```
WP-01 WP-02 WP-03 DBG-01 SEC-02 SEC-03 TZ-01 SEC-10 SEC-27 BUG-05 BUG-07 SEC-35 SEC-37 A11Y-03 JS-02 JS-04 JS-05
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

**`handoff` / repeat-handoff-opus** — 15 still open:

```
WP-01 WP-02 WP-03 DBG-01 SEC-02 SEC-05 TZ-01 SEC-27 BUG-05 BUG-07 SEC-35 SEC-37 A11Y-03 JS-02 JS-04
```

**`oneshot` / repeat-oneshot-opus** — 16 still open:

```
WP-02 WP-03 BUG-02 DBG-01 SEC-02 SEC-03 SEC-10 SEC-27 BUG-05 BUG-07 SEC-35 SEC-37 A11Y-03 JS-02 JS-03 JS-04
```

## Raw data

- `results/runs.jsonl` — one JSON object per run, the source of truth.
- `results/results.csv` — one row per run.
- `results/phases.csv` — one row per phase, with the per-turn context series.
- `runs/<name>/` — transcripts (`*.jsonl`), `REVIEW.md`, `PLAN.md`, `IMPLEMENTATION.md`, `fix.diff`.

