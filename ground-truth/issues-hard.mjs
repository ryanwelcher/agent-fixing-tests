/**
 * Hard-tier ground truth for fixture/wp-member-directory.
 *
 * Unlike the first fixture, this plugin is MOSTLY CORRECT: nonces, capability
 * checks, prepared statements, escaping and i18n are right almost everywhere.
 * That matters. In a uniformly broken codebase "flag everything" scores well.
 * Here it costs you, because the decoys below are deliberately innocent.
 *
 * Every defect needs either cross-file reasoning, knowledge of what a WordPress
 * function actually does, or reasoning about time and state. None can be found
 * by grepping a single line.
 */

export const issues = [
	{
		id: 'H-01', cat: 'security', sev: 'critical',
		file: 'templates/member-card.php',
		title: 'html_entity_decode() undoes esc_attr(), reopening attribute-breakout XSS',
		why: 'The bio is sanitised correctly on save and escaped correctly here, then decoded back to the original bytes. sanitize_textarea_field() strips tags but keeps quotes, so a bio of `" onmouseover="alert(1)` breaks out of the data-bio attribute. Both halves look right in isolation; the defect only exists in the composition.',
		crossFile: 'includes/class-mdir-profile.php (the save path that makes this look safe)',
		keywords: [ 'html_entity_decode', 'decode', 'esc_attr', 'attribute', 'xss' ],
		forbid: [ /html_entity_decode/ ],
	},
	{
		id: 'H-02', cat: 'security', sev: 'critical',
		file: 'includes/class-mdir-db.php',
		title: 'Second-order SQL injection through the featured-members option',
		why: 'get_featured_ids() returns an operator-controlled string straight into IN (...). The REST /featured route sanitises with sanitize_text_field(), which happily preserves `1,2) UNION SELECT user_pass,1 FROM wp_users--`. Chained with H-03 any subscriber can read password hashes.',
		crossFile: 'includes/class-mdir-rest.php writes the option; class-mdir-directory.php and class-mdir-rest.php both consume the string return value, so changing the contract breaks them',
		keywords: [ 'sql injection', 'in (', 'featured', 'second-order', 'prepare' ],
		forbid: [ /IN \(\{\$ids\}\)/ ],
		require: [ /prepare/ ],
	},
	{
		id: 'H-03', cat: 'security', sev: 'critical',
		file: 'includes/class-mdir-roles.php',
		title: 'mdir_manage granted to every subscriber',
		why: 'The REST permission callbacks check current_user_can( \'mdir_manage\' ) and look correct. The escalation is in the role sync, in a different file: every subscriber is handed the capability that gates featured-member writes.',
		crossFile: 'includes/class-mdir-rest.php (the check that looks correct because of this grant)',
		keywords: [ 'capability', 'subscriber', 'add_cap', 'privilege', 'escalation', 'mdir_manage' ],
		forbid: [ /\$subscriber->add_cap\( 'mdir_manage' \)/ ],
	},
	{
		id: 'H-04', cat: 'security', sev: 'high',
		file: 'includes/class-mdir-db.php',
		title: 'Second-order SQL injection via stored company meta',
		why: 'members_by_company() concatenates a value read back out of usermeta. It was sanitised on save with sanitize_text_field(), which does not escape SQL quotes. Sanitising on input is not escaping for a query.',
		crossFile: 'includes/class-mdir-profile.php (the save that makes the value look trusted)',
		keywords: [ 'sql injection', 'second-order', 'company', 'usermeta', 'prepare', 'sanitize' ],
		forbid: [ /meta_value = '" \. \$company \. "'/ ],
		require: [ /prepare/ ],
	},
	{
		id: 'H-05', cat: 'correctness', sev: 'high',
		file: 'includes/class-mdir-booking.php',
		title: 'Check-then-act race lets an event be overbooked',
		why: 'count_bookings() then add_booking() with nothing between them. Two concurrent requests both read taken < capacity and both insert. Needs a transaction, a lock, or a uniqueness constraint the insert can fail against. No single line is wrong.',
		keywords: [ 'race', 'concurren', 'toctou', 'transaction', 'lock', 'overbook', 'atomic' ],
		codeCheck: false,
	},
	{
		id: 'H-06', cat: 'correctness', sev: 'high',
		file: [ 'wp-member-directory.php', 'assets/js/directory.js', 'includes/class-mdir-ajax.php' ],
		title: 'Favourite button is permanently broken: nonce verified but never issued',
		why: 'check_ajax_referer( \'mdir_favorite\', \'nonce\' ) is correct. Nothing ever creates that nonce: wp_localize_script() passes only ajaxUrl and restUrl, and directory.js sends no nonce field. Every favourite request dies with -1. Finding it means noticing a missing counterpart across three files.',
		keywords: [ 'nonce', 'wp_create_nonce', 'localize', 'check_ajax_referer', 'missing', 'favourite', 'favorite' ],
		require: [ /wp_create_nonce/, /nonce/ ],
	},
	{
		id: 'H-07', cat: 'security', sev: 'high',
		file: 'wp-member-directory.php',
		title: 'The plugin opens its own private REST route',
		why: 'can_read_directory() defaults to false, which reads as secure. The plugin then registers __return_true on that filter at load, publishing the full member listing to anonymous requests. The route and the filter are in different files.',
		crossFile: 'includes/class-mdir-rest.php (the permission callback that looks safe)',
		keywords: [ 'filter', '__return_true', 'permission_callback', 'public', 'rest', 'default' ],
		forbid: [ /add_filter\( 'mdir_public_directory', '__return_true' \)/ ],
	},
	{
		id: 'H-08', cat: 'security', sev: 'high',
		file: 'includes/class-mdir-directory.php',
		title: 'Private member emails leak through a shared transient',
		why: 'card() includes user_email when the viewer has mdir_view_private. The rendered HTML is cached under one static key for everyone, so whatever an administrator renders first is served to anonymous visitors until it expires. The cache call and the private branch are in different files.',
		crossFile: 'templates/member-card.php (the conditional that puts private data in the cached output)',
		keywords: [ 'cache', 'transient', 'cache key', 'poison', 'private', 'email', 'leak' ],
		forbid: [ /get_transient\( self::CACHE_KEY \)/ ],
		require: [ /get_current_user_id|is_user_logged_in|mdir_can_view_private|md5\(/ ],
	},
	{
		id: 'H-09', cat: 'security', sev: 'high',
		file: 'includes/functions.php',
		title: 'esc_attr() on an href permits javascript: URLs',
		why: 'Escaping is present, which is why a pattern scan passes it. esc_attr() only encodes HTML metacharacters; it does not restrict the URL scheme. The website field is stored with sanitize_text_field(), which does not validate a URL either, so javascript:alert(1) reaches the href intact. esc_url() is the function that strips the protocol.',
		keywords: [ 'esc_url', 'esc_attr', 'javascript:', 'protocol', 'href', 'url' ],
		forbid: [ /esc_attr\( \$url \)/ ],
		require: [ /esc_url/ ],
	},
	{
		id: 'H-10', cat: 'correctness', sev: 'medium',
		file: 'includes/class-mdir-db.php',
		title: 'Pagination offset is off by one page, hiding the first results',
		why: 'offset = page * per_page with a 1-based page. Page 1 skips the first 20 members and the first page of results is unreachable. The query is correctly prepared, so nothing about it looks wrong.',
		keywords: [ 'offset', 'pagination', 'off-by-one', 'page', 'limit' ],
		forbid: [ /\$offset = \$page \* \$per_page;/ ],
		require: [ /\( \$page - 1 \)/ ],
	},
];

/**
 * Deliberately innocent code that pattern-matches a vulnerability.
 *
 * Flagging one of these as a defect is a FALSE POSITIVE and counts against
 * precision. Recommending prepare()/escaping as hygiene is fine; calling it a
 * vulnerability is not.
 */
export const decoys = [
	{
		id: 'D-01',
		file: 'includes/class-mdir-db.php',
		looks_like: 'SQL injection - a string concatenated into a DELETE',
		why_its_fine: '$cutoff is produced by gmdate() from a hardcoded interval. No caller-controlled value reaches the query.',
		keywords: [ 'prune_log', 'delete', 'cutoff', 'sql injection' ],
	},
	{
		id: 'D-02',
		file: 'includes/class-mdir-directory.php',
		looks_like: 'Unescaped output - echo $html with no escaping at the echo site',
		why_its_fine: 'Every component of $html was passed through esc_html() or esc_url() a few lines earlier in search_state(). Escaping at assembly time is correct.',
		keywords: [ 'search_state', 'echo $html', 'unescaped', 'xss' ],
	},
	{
		id: 'D-03',
		file: 'includes/class-mdir-rest.php',
		looks_like: "permission_callback => '__return_true' on a REST route",
		why_its_fine: '/members/count returns a single aggregate count of users, which is not sensitive and is already public on the marketing page. A public route with an explicit __return_true is correct here.',
		keywords: [ '__return_true', 'members/count', 'permission_callback' ],
	},
	{
		id: 'D-04',
		file: 'includes/class-mdir-ajax.php',
		looks_like: 'wp_ajax_nopriv_ handler exposed to anonymous users',
		why_its_fine: 'mdir_member_count is read-only, returns the same public aggregate, takes no input and writes nothing. nopriv is the point of the endpoint.',
		keywords: [ 'nopriv', 'member_count', 'anonymous' ],
	},
	{
		id: 'D-05',
		file: 'templates/member-card.php',
		looks_like: 'Undefined variable $user_id used in a template',
		why_its_fine: 'The template is included from MDIR_Directory::card(), which defines $user_id in the including scope. It is documented with an @var annotation. This is the standard WordPress template-part pattern.',
		keywords: [ 'undefined', '$user_id', 'variable', 'template' ],
	},
];

export default issues;
