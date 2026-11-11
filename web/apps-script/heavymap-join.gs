/**
 * HeavyMap signup processor (spec E sections 4 and 6; decisions 42–53).
 *
 * Bound to the HeavyMap signup Google Form's response Sheet. Self-contained:
 * it doesn't need Niagara Assembly's _shared.gs. Its Kit and GitHub helpers
 * are adapted from niagaraassembly/site google-apps-script/_shared.gs at 9522b3e.
 *
 * Form question titles (must match exactly): Name, Email, Desks
 *   Desks is a checkbox question whose options are the Desk slugs:
 *   western-new-york, niagara-brant
 *
 * Script Properties (set by Morgen; never in this file or the repository):
 *   GITHUB_TOKEN  fine-grained PAT, Issues: write on niagaraassembly/crm
 *   KIT_API_KEY   Kit v4 API key
 *   KIT_FORM_ID   the double-opt-in Kit form subscribers are added through
 *
 * Triggers (Triggers > + Add Trigger):
 *   onFormSubmit   From spreadsheet > On form submit
 *   dailyKitCheck  Time-driven > Day timer > 8am to 9am (spec E section 6, decision 53)
 */

var REPO = 'niagaraassembly/crm';
var DESK_TAGS = {
  'western-new-york': { tag: 'hm-desk-western-new-york', name: 'Western New York' },
  'niagara-brant': { tag: 'hm-desk-niagara-brant', name: 'Niagara–Brant' }
};
var STATUS_HEADER = 'Kit status';
var FAILURE_ISSUE = 'HeavyMap signup: Kit failures';

/* ---- signup ---------------------------------------------------------------- */

function onFormSubmit(e) {
  var v = e.namedValues;
  var pick = function (title) { return (v[title] && v[title][0] ? v[title][0] : '').trim(); };
  var name = pick('Name');
  var email = pick('Email');
  var desks = pick('Desks').split(',').map(function (d) { return d.trim(); })
    .filter(function (d) {
      if (DESK_TAGS[d]) return true;
      if (d) Logger.log('heavymap-join: unknown Desk "%s" ignored', d);
      return false;
    });

  var names = desks.map(function (d) { return DESK_TAGS[d].name; }).join(', ') || 'no Desk';
  createIssue_('HeavyMap signup: ' + name + ' (' + names + ')',
    ['Desks: **' + names + '**', '', 'Name: ' + name, 'Email: ' + email, '',
     'Mailing list only. Nothing to do: close this.'].join('\n'),
    ['heavymap-signup']);

  /* Kit failures never stop the issue; they're recorded in the row for the daily check. */
  var failures = [];
  var props = PropertiesService.getScriptProperties();
  desks.forEach(function (d) {
    try {
      kitUpsertAndTag_(email, name, DESK_TAGS[d].tag, props.getProperty('KIT_API_KEY'), props.getProperty('KIT_FORM_ID'));
    } catch (err) {
      failures.push(DESK_TAGS[d].tag + ': ' + err.message);
      Logger.log('kit: FAILED to tag %s with "%s": %s', email, DESK_TAGS[d].tag, err.message);
    }
  });
  writeStatus_(e.range, failures.length ? 'FAILED ' + failures.join('; ') : 'OK');
}

function writeStatus_(range, text) {
  var sheet = range.getSheet();
  var col = statusColumn_(sheet);
  sheet.getRange(range.getRow(), col).setValue(text);
}

function statusColumn_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var i = headers.indexOf(STATUS_HEADER);
  if (i !== -1) return i + 1;
  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue(STATUS_HEADER);
  return col;
}

/* ---- daily failure check (spec E section 6) -------------------------------- */

/** Lists the last 7 days' signups whose Kit tagging failed, or whose Desk tag
 *  is missing in Kit, in one private issue. Never retries into Kit. */
function dailyKitCheck() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var rows = sheet.getDataRange().getValues();
  var head = rows.shift();
  var col = function (title) { return head.indexOf(title); };
  var since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  var apiKey = PropertiesService.getScriptProperties().getProperty('KIT_API_KEY');
  var problems = [];
  rows.forEach(function (r) {
    var when = r[col('Timestamp')];
    if (!(when instanceof Date) || when < since) return;
    var email = String(r[col('Email')] || '').trim();
    var status = String(r[col(STATUS_HEADER)] || '');
    if (status.indexOf('FAILED') === 0) { problems.push(email + ': ' + status); return; }
    String(r[col('Desks')] || '').split(',').map(function (d) { return d.trim(); }).forEach(function (d) {
      if (DESK_TAGS[d] && !hasKitTag_(email, DESK_TAGS[d].tag, apiKey)) problems.push(email + ': missing tag ' + DESK_TAGS[d].tag);
    });
  });
  if (!problems.length) { Logger.log('dailyKitCheck: no failures in the last 7 days'); return; }
  createIssue_(FAILURE_ISSUE + ' (' + Utilities.formatDate(new Date(), 'America/Toronto', 'yyyy-MM-dd') + ')',
    'Signups from the last 7 days that need retagging in Kit by hand:\n\n- ' + problems.join('\n- '),
    ['heavymap-signup']);
}

function hasKitTag_(email, tagName, apiKey) {
  var res = UrlFetchApp.fetch('https://api.kit.com/v4/subscribers?email_address=' + encodeURIComponent(email),
    { headers: { 'X-Kit-Api-Key': apiKey }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return false;
  var sub = (JSON.parse(res.getContentText()).subscribers || [])[0];
  if (!sub) return false;
  var tags = UrlFetchApp.fetch('https://api.kit.com/v4/subscribers/' + sub.id + '/tags',
    { headers: { 'X-Kit-Api-Key': apiKey }, muteHttpExceptions: true });
  if (tags.getResponseCode() !== 200) return false;
  return (JSON.parse(tags.getContentText()).tags || []).some(function (t) { return t.name.toLowerCase() === tagName.toLowerCase(); });
}

/* ---- self-test: run by hand after setup ------------------------------------ */

function runSelfTest() {
  var props = PropertiesService.getScriptProperties();
  ['GITHUB_TOKEN', 'KIT_API_KEY', 'KIT_FORM_ID'].forEach(function (n) {
    if (!props.getProperty(n)) throw new Error('FAIL: ' + n + ' script property is not set');
  });
  Object.keys(DESK_TAGS).forEach(function (d) {
    if (!findKitTag_(DESK_TAGS[d].tag, props.getProperty('KIT_API_KEY'))) {
      throw new Error('FAIL: Kit tag "' + DESK_TAGS[d].tag + '" does not exist; create it in Kit first');
    }
  });
  Logger.log('runSelfTest: OK (properties set, Desk tags exist)');
}

/* ---- helpers adapted from niagaraassembly/site _shared.gs (9522b3e) -------- */

function createIssue_(title, body, labels) {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + REPO + '/issues', {
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ title: title, body: body, labels: labels }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) Logger.log('github: issue creation FAILED (HTTP %s): %s', res.getResponseCode(), res.getContentText());
  return res;
}

function findKitTag_(tagName, apiKey) {
  var wanted = tagName.toLowerCase();
  var url = 'https://api.kit.com/v4/tags?per_page=1000';
  while (url) {
    var res = UrlFetchApp.fetch(url, { headers: { 'X-Kit-Api-Key': apiKey }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Kit rejected the tags request (HTTP ' + res.getResponseCode() + ')');
    var payload = JSON.parse(res.getContentText());
    var match = (payload.tags || []).filter(function (t) { return t.name.toLowerCase() === wanted; })[0];
    if (match) return match;
    var page = payload.pagination || {};
    url = page.has_next_page && page.end_cursor ? 'https://api.kit.com/v4/tags?per_page=1000&after=' + encodeURIComponent(page.end_cursor) : null;
  }
  return null;
}

function kitUpsertAndTag_(email, firstName, tagName, apiKey, formId) {
  if (!apiKey) throw new Error('KIT_API_KEY script property is not set.');
  if (!formId) throw new Error('KIT_FORM_ID script property is not set.');
  if (!email) throw new Error('No email captured for Kit.');
  var post = function (url, payload) {
    var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'X-Kit-Api-Key': apiKey }, payload: JSON.stringify(payload), muteHttpExceptions: true });
    if (res.getResponseCode() >= 300) throw new Error(url.split('/v4/')[1] + ' HTTP ' + res.getResponseCode());
  };
  post('https://api.kit.com/v4/subscribers', { email_address: email, first_name: firstName, state: 'inactive' });
  /* Adding to the double-opt-in form is what makes Kit send its confirmation email. */
  post('https://api.kit.com/v4/forms/' + formId + '/subscribers', { email_address: email });
  var match = findKitTag_(tagName, apiKey);
  if (!match) throw new Error('Kit has no tag named "' + tagName + '"; create it first.');
  post('https://api.kit.com/v4/tags/' + match.id + '/subscribers', { email_address: email });
}
