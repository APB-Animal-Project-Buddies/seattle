/**
 * Apps Script for the APB projects sheet — adds an "APB" menu that pushes the
 * sheet into the production `projects` table.
 *
 * This is a COPY for version control. The live copy lives in the spreadsheet:
 *   Extensions -> Apps Script. Paste this in, then set the two Script Properties
 *   below (Project Settings -> Script Properties). Setup steps are in
 *   backend_migrations/README.md.
 *
 * Script Properties (NOT hardcoded — anyone who can edit the sheet can read them,
 * so this holds only the scoped sync key, never the Hasura admin secret):
 *   SYNC_URL  https://<your-apb-seattle-domain>/api/projects/sync
 *   API_KEY   value of PROJECTS_SYNC_API_KEY in the apb-seattle environment
 */

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

function runProjectSync(dryRun) {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var syncUrl = props.getProperty('SYNC_URL');
  var apiKey = props.getProperty('API_KEY');

  if (!syncUrl || !apiKey) {
    ui.alert('Setup needed', 'Set SYNC_URL and API_KEY in Project Settings -> Script Properties.', ui.ButtonSet.OK);
    return;
  }

  // Flush pending edits so the CSV export the server reads is current.
  SpreadsheetApp.flush();

  var response;
  try {
    response = UrlFetchApp.fetch(syncUrl + (dryRun ? '?dryRun=1' : ''), {
      method: 'post',
      headers: { 'x-api-key': apiKey },
      muteHttpExceptions: true,
    });
  } catch (error) {
    ui.alert('Sync failed', String(error), ui.ButtonSet.OK);
    return;
  }

  var code = response.getResponseCode();
  var body = response.getContentText();
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
