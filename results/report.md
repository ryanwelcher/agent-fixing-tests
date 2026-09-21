# Two-model review handoff: results

_Generated 2026-09-21 16:02 from 2 run(s) in `results/runs.jsonl` (1 superseded row(s) ignored)._

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

## Fix quality

Of the fixes the detectors passed, how many survive reading the code.

| Arm | Implementer | Correct | Superficial | Removed feature | Uncertain | Regressions introduced | Detector overstated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | 31 | 4 | 0 | 0 | 11 | 11% |
| `handoff` | sonnet | 56 | 5 | 3 | 0 | 8 | 13% |

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

## Fix rate by severity

| Arm | Run | Critical | High | Medium | Low |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 15/22 | 15/32 | 2/12 | 3/9 |
| `handoff` | matrix-handoff-sonnet | 20/22 | 27/32 | 9/12 | 8/9 |

## Fix rate by category

| Arm | Run | accessibility | correctness | i18n | performance | security | wp-standards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 1/3 | 5/11 | 1/1 | 0/4 | 27/44 | 1/12 |
| `handoff` | matrix-handoff-sonnet | 3/3 | 8/11 | 1/1 | 4/4 | 37/44 | 11/12 |

## Review recall vs. fixes landed

The gap between what the reviewer found and what the implementer landed is the cost of the handoff.

| Arm | Run | Judge recall | False positives | Fixed | Found→fixed |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | ~35/76 (heur.) | - | 35 | 100% |
| `handoff` | matrix-handoff-sonnet | 64/76 | 2 | 64 | 100% |

## Tokens and context, per phase

| Arm | Phase | Model | Turns | Tools | Output | Cache read | Billed in | Total | Cost | Peak context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | review | haiku | 22 | 21 | 18,655 | 293,296 | 333,877 | 352,532 | $0.204 | 54,204 (27%) |
| `handoff` | fix | haiku | 53 | 52 | 24,072 | 2,695,948 | 2,753,879 | 2,777,951 | $0.505 | 71,202 (36%) |
| `handoff` | verify | - | 9 | 8 | 22,724 | 322,959 | 394,731 | 417,455 | $1.447 | 81,878 (8%) |
| `handoff` | review | opus | 11 | 10 | 53,927 | 454,160 | 538,617 | 592,544 | $2.420 | 94,555 (9%) |
| `handoff` | fix | sonnet | 6 | 5 | 18,524 | 320,850 | 389,161 | 407,685 | $0.523 | 78,522 (8%) |
| `handoff` | verify | - | 13 | 12 | 27,958 | 703,159 | 796,501 | 824,459 | $1.984 | 103,436 (10%) |

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

## Raw data

- `results/runs.jsonl` — one JSON object per run, the source of truth.
- `results/results.csv` — one row per run.
- `results/phases.csv` — one row per phase, with the per-turn context series.
- `runs/<name>/` — transcripts (`*.jsonl`), `REVIEW.md`, `PLAN.md`, `IMPLEMENTATION.md`, `fix.diff`.

