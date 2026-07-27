// SETUP INSTRUCTIONS:
// 1. Open the projects sheet -> Extensions -> Apps Script (open it from the sheet, so
//    the script is bound to it — a standalone project won't get the menu)
// 2. Paste this entire script, replacing any existing code
// 3. Replace YOUR_API_KEY_HERE below with the value of PROJECTS_SYNC_API_KEY from the
//    apb-seattle environment
// 4. Save, then reload the spreadsheet — an "APB" menu appears next to Help
// 5. The first run asks for authorization (the script makes an external request)
//
// There is no "Deploy" step: an onOpen menu only needs a save and a reload.
//
// This is a COPY for version control — the live copy lives in the spreadsheet, and
// nothing syncs the two. Full docs are in apb-seattle/README.md.
//
// Put the real key in the SHEET's copy only. This repository is public, so the copy
// here must keep the placeholder — committing the key would publish it.
//
// The key below is scoped: it only allows triggering this sheet -> database sync,
// which is idempotent. Never put the Hasura admin secret here — anyone who can edit
// the sheet can read this script.

// Configuration — set your API key. Leave a value as its YOUR_..._HERE placeholder to
// fall back to the Script Property of the same name (Project Settings -> Script
// Properties), which is how this script was previously configured.
//
// NOTE: use the canonical "www" host. The bare domain 308-redirects to www, and
// following that redirect can downgrade the POST to a GET (HTTP 405). This script
// re-sends the request itself to survive that, but the correct host avoids the hop.
var SYNC_URL = 'https://www.animalprojectbuddies.com/api/projects/sync';
var API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual key

/**
 * Returns the effective config, preferring the constants above and falling back to
 * Script Properties for any value left at its placeholder.
 */
function getSyncConfig() {
  var props = PropertiesService.getScriptProperties();
  var isSet = function (value) {
    return value && value.indexOf('YOUR_') !== 0;
  };
  return {
    syncUrl: isSet(SYNC_URL) ? SYNC_URL : props.getProperty('SYNC_URL'),
    apiKey: isSet(API_KEY) ? API_KEY : props.getProperty('API_KEY'),
  };
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('APB')
    .addItem('Preview sync (no changes)', 'previewProjectSync')
    .addItem('Sync projects to prod', 'syncProjectsToProd')
    .addToUi();
}

function previewProjectSync() {
  runProjectSync(true);
}

function syncProjectsToProd() {
  runProjectSync(false);
}

/**
 * POSTs to `url`, re-sending the request ourselves on a redirect.
 *
 * UrlFetchApp's own redirect following is unsafe for this: crossing the bare
 * domain -> www 308 it can drop the x-api-key header, or downgrade the POST to a
 * GET, which the endpoint answers with 405. So redirects are handled here, with
 * the method and headers reattached on every hop.
 */
function postFollowingRedirects(url, apiKey) {
  var options = {
    method: 'post',
    headers: { 'x-api-key': apiKey },
    followRedirects: false,
    muteHttpExceptions: true,
  };

  var requestedUrl = url;
  var current = url;

  for (var hop = 0; hop < 4; hop++) {
    var response = UrlFetchApp.fetch(current, options);
    var code = response.getResponseCode();
    if (code < 300 || code >= 400) {
      return { response: response, requestedUrl: requestedUrl, finalUrl: current };
    }

    var headers = response.getAllHeaders();
    var location = headers.Location || headers.location;
    if (!location) {
      return { response: response, requestedUrl: requestedUrl, finalUrl: current };
    }

    // Location may be relative — resolve it against the current origin.
    current =
      location.indexOf('http') === 0
        ? location
        : current.replace(/^(https?:\/\/[^\/]+).*$/, '$1') + location;
  }

  throw new Error('Too many redirects starting from ' + requestedUrl);
}

function runProjectSync(dryRun) {
  var ui = SpreadsheetApp.getUi();
  var config = getSyncConfig();
  var syncUrl = config.syncUrl;
  var apiKey = config.apiKey;

  if (!syncUrl || !apiKey) {
    ui.alert(
      'Setup needed',
      'Set SYNC_URL and API_KEY at the top of the script (or as Script Properties of the same name).',
      ui.ButtonSet.OK
    );
    return;
  }

  // Flush pending edits so the CSV export the server reads is current.
  SpreadsheetApp.flush();

  var result_;
  try {
    result_ = postFollowingRedirects(syncUrl + (dryRun ? '?dryRun=1' : ''), apiKey);
  } catch (error) {
    ui.alert('Sync failed', String(error), ui.ButtonSet.OK);
    return;
  }

  var response = result_.response;
  var code = response.getResponseCode();
  var body = response.getContentText();

  // If we had to redirect, the stored SYNC_URL is wrong. It still worked, because we
  // re-sent the POST ourselves, but say so — left alone it's a latent failure.
  if (result_.finalUrl !== result_.requestedUrl) {
    ui.alert(
      'Update SYNC_URL',
      'SYNC_URL redirected, so the request was re-sent to:\n\n' +
        result_.finalUrl.split('?')[0] +
        '\n\nUpdate SYNC_URL at the top of the script to that address. ' +
        'The sync still ran.',
      ui.ButtonSet.OK
    );
  }
  var result;
  try {
    result = JSON.parse(body);
  } catch (error) {
    ui.alert('Sync failed', 'HTTP ' + code + '\n\n' + body.slice(0, 500), ui.ButtonSet.OK);
    return;
  }

  if (code !== 200 || !result.ok) {
    ui.alert('Sync failed', 'HTTP ' + code + '\n\n' + (result.error || body).slice(0, 500), ui.ButtonSet.OK);
    return;
  }

  var lines = [];
  lines.push(result.dryRun ? 'PREVIEW — nothing was written.' : 'Sync applied.');
  lines.push('');
  lines.push('Sheet rows read: ' + result.sheetRows);
  lines.push('Unchanged: ' + result.unchanged);

  if (result.inserted.length) {
    lines.push('');
    lines.push('New (' + result.inserted.length + '):');
    lines.push('  ' + result.inserted.join(', '));
  }

  if (result.updated.length) {
    lines.push('');
    lines.push('Updated (' + result.updated.length + '):');
    for (var i = 0; i < result.updated.length; i++) {
      lines.push('  ' + result.updated[i].project_handle + ' — ' + result.updated[i].fields.join(', '));
    }
  }

  if (result.orphans.length) {
    lines.push('');
    lines.push('In the database but NOT in this sheet (left untouched):');
    lines.push('  ' + result.orphans.join(', '));
    lines.push('  Add a row with Deprecated = TRUE to bring them under sync.');
  }

  if (!result.inserted.length && !result.updated.length) {
    lines.push('');
    lines.push('Everything already matches the sheet.');
  }

  SpreadsheetApp.getUi().alert(result.dryRun ? 'Sync preview' : 'Sync complete', lines.join('\n'), ui.ButtonSet.OK);
}
