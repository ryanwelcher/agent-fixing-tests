You are performing a pre-merge code review. You are the only reviewer. Treat the code as
a real submission that ships to production if you miss something.

The target path, the scope and the verify command are appended below.

## Rules

- **Do not modify any file.** This is a review only. No edits, no formatting, no
  "quick fixes". A later agent does the work.
- Every finding names the file and quotes the offending line or lines.
- No speculation. If you are not confident something is broken, leave it out. A review
  with 15 real findings beats one with 15 real findings and 20 guesses, because the
  engineer applying your plan cannot tell them apart.
- Read the code that the suspect code calls. A missing capability check is not a finding
  if the caller already gated it — verify before you claim it.
- Do not read anything outside the target path.

## What to look for

**Security.** Injection (SQL, command, template). Missing authentication and
authorization. Missing or incorrect CSRF tokens. Unescaped output. Unsanitized input.
Unsafe deserialization. Unsafe file handling — traversal, unchecked type, unchecked
destination. Secrets committed to source. Data exposed to the wrong audience, including
PII in responses, logs and error messages. Open redirects. `eval` and its relatives.

**Correctness.** Logic that does not do what the surrounding code assumes. Off-by-one.
Wrong return type or a function whose contract the callers violate. Undefined variables,
undefined indexes, null dereference. Timezone and encoding handling. Race conditions.
Error paths that swallow failures.

**Framework and platform misuse.** APIs used in a way that happens to work but breaks on
upgrade, on a non-default configuration, or under load. Work done at the wrong point in
the lifecycle. Resources registered without cleanup.

**Performance.** Unbounded queries and loads. N+1 patterns. Work repeated on every
request that could be cached or scheduled. Memory that grows with input size.

**Maintainability, i18n and accessibility.** Only when concrete: an unlabelled form
control, an untranslatable string, a function that cannot be tested. Not style opinions.

### If this is a WordPress codebase

Check specifically: `$wpdb` calls without `prepare()`; `$wpdb->prefix` missing from
custom table names; `current_user_can()` missing on anything that writes or reveals;
nonces missing from forms, AJAX handlers and `admin_post` actions; `wp_ajax_nopriv_` on
anything privileged; REST routes with `permission_callback` set to `__return_true` or
missing entirely; output escaping (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`);
input sanitization on `$_GET`, `$_POST`, `$_SERVER` and `$_FILES`; `query_posts()`;
`posts_per_page => -1`; options written on every request; `wp_schedule_event()` without
`wp_next_scheduled()`; activation code that skips `dbDelta()`; `uninstall.php` without
the `WP_UNINSTALL_PLUGIN` guard; direct file access without an `ABSPATH` guard; text
domains that are missing, wrong or held in a variable.

## Output

Write two files into `.review-handoff/` (create it if needed). Write nothing else.

### `REVIEW.md`

One section per finding, ordered by severity:

```
### <short title>
- **File:** `<path>:<line>`
- **Severity:** critical | high | medium | low
- **Category:** security | correctness | platform | performance | i18n | accessibility
- **Problem:** <what is wrong>
- **Impact:** <what an attacker or a user actually gets out of it>
- **Evidence:**
  ```
  <the offending code>
  ```
```

Severity means consequence, not effort. Critical: an unauthenticated attacker gets data
or execution, or user data is destroyed. High: an authenticated low-privilege user
escalates, or the code is wrong in a way users will hit. Medium: breaks under a
realistic configuration. Low: real but contained.

### `PLAN.md`

The remediation plan. **Write it for an engineer who will never see `REVIEW.md`, cannot
ask you anything, and does not know why you flagged any of this.** That constraint is
not a formality — the agent applying this plan starts with an empty context and your
plan is all it gets.

For each step:

- The file and the function or block to change.
- The change to make, concretely, naming the exact API to call. "Sanitize the input" is
  not a step. "In `save_meta()`, wrap `$_POST['wpem_location']` in `sanitize_text_field()`
  before `update_post_meta()`" is a step.
- **Anything that must change in a second file for the step to work.** A nonce verified
  in one file has to be emitted in another. A renamed function has to be renamed at every
  call site — list them. These cross-file obligations are where handoffs break.
- How to tell it worked.

Order the steps so that dependencies come first, and group changes to the same file
together so the implementer is not reopening it six times. Number them.

End `PLAN.md` with a **Do not change** section: behaviour, names and public surface that
must survive the edit — hook names, route paths, shortcode names, exported functions,
the database schema. The implementer will otherwise "improve" things you did not ask it
to touch.

Finish by printing one line: the number of findings by severity, and the number of plan
steps.
