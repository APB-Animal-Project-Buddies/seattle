// SETUP INSTRUCTIONS:
// 1. Open your Google Sheet → Extensions → Apps Script
// 2. Paste this entire script, replacing any existing code
// 3. Replace YOUR_API_KEY_HERE with the actual API key
// 4. To set up automatic 30-minute sync:
//    a. In Apps Script, click the clock icon (Triggers) in the left sidebar
//    b. Click "+ Add Trigger"
//    c. Choose function: syncToWebsite
//    d. Event source: Time-driven
//    e. Type: Minutes timer → Every 30 minutes
//    f. Click Save (you'll need to authorize the script)
// 5. Reload the Google Sheet — you should see an "APB Tools" menu

// Configuration — set your API key and website URL
// NOTE: use the canonical "www" host. The bare domain 308-redirects to www,
// and UrlFetchApp can drop the x-api-key header (or downgrade POST to GET) when
// following that redirect — which silently breaks the sync.
const API_URL = "https://www.animalprojectbuddies.com/api/ideas";
const API_KEY = "YOUR_API_KEY_HERE"; // Replace with actual key

/**
 * Adds a custom menu to the Google Sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("APB Tools")
    .addItem("Sync to Website", "syncToWebsite")
    .addToUi();
}

/**
 * Reads all rows from the active sheet and POSTs them to the website API.
 *
 * Column layout (0-indexed): A=Idea, B=Description, C=Notes/Resources, D=Contact.
 * A row is only synced if column A (the title) has text. Rows that have data in
 * B/C/D but no title in A are almost always a mistake, so we collect their row
 * numbers and warn about them instead of dropping them silently.
 */
function syncToWebsite() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const ideas = [];
  const skippedRows = []; // 1-based sheet row numbers that had notes but no title

  // data[0] is the header row (sheet row 1), so data[i] maps to sheet row i + 1.
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idea = (row[0] || "").toString().trim();
    const subIdeas = (row[1] || "").toString().trim();
    const otherNotes = (row[2] || "").toString().trim();
    const contactEmail = (row[3] || "").toString().trim();

    if (!idea) {
      // Only flag rows that clearly meant to be an idea (some other column filled).
      if (subIdeas || otherNotes || contactEmail) {
        skippedRows.push(i + 1);
      }
      continue;
    }

    ideas.push({
      idea: idea,
      sub_ideas: subIdeas || null,
      other_notes: otherNotes || null,
      contact_email: contactEmail || null,
      sort_order: ideas.length,
    });
  }

  const ui = SpreadsheetApp.getUi();

  if (ideas.length === 0) {
    ui.alert(buildSkippedNote("No valid ideas found in the sheet.", skippedRows));
    return;
  }

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": API_KEY },
    payload: JSON.stringify(ideas),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(API_URL, options);
  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code !== 200) {
    ui.alert("❌ Sync failed (HTTP " + code + "): " + body);
    return;
  }

  // A 200 is NOT proof of success. If the POST gets redirected (e.g. the bare
  // domain -> www), UrlFetchApp can downgrade it to a GET against the read
  // endpoint, which also returns 200 with {"ideas":[...]} but writes nothing.
  // The write handler always returns a numeric "synced"; the read handler never
  // does. So a numeric "synced" is our proof the POST actually wrote.
  let result = {};
  try {
    result = JSON.parse(body) || {};
  } catch (e) {
    result = {};
  }

  if (typeof result.synced !== "number") {
    ui.alert(
      "⚠️ Sync did NOT confirm a write.\n\n" +
      "The server returned HTTP 200 but not a write confirmation — the request " +
      "was likely redirected or hit the wrong endpoint, so nothing was saved.\n\n" +
      "Response body:\n" + body
    );
    return;
  }

  let message = "✅ Synced " + result.synced + " idea" + (result.synced === 1 ? "" : "s") + " to the website.";
  if (skippedRows.length > 0) {
    message = buildSkippedNote(message, skippedRows);
  }
  ui.alert(message);
}

/**
 * Appends a warning about rows that were skipped because column A (title) was
 * blank even though other columns had content.
 */
function buildSkippedNote(message, skippedRows) {
  if (!skippedRows || skippedRows.length === 0) return message;
  const label = skippedRows.length === 1 ? "row" : "rows";
  return message +
    "\n\n⚠️ Skipped " + skippedRows.length + " " + label +
    " with content but no title in column A: " + label + " " + skippedRows.join(", ") +
    ".\nAdd a title in column A (or clear the row) to fix this.";
}
