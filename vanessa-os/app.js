/* Vanessa OS — Nextier Field Execution OS (static demo)
 * All data is synthetic and stored only in this browser (localStorage).
 * Nothing here calls a CRM, speech service, or Nextier server.
 */
(function () {
  "use strict";

  // ---------- constants ----------
  var KEY = "vos.v1";
  var AGENT = "Vanessa R.";
  var ASSISTANT = "Field Assistant";

  var FIELD_STATUS = ["Not Visited", "Scheduled for Visit", "Visited — No Contact", "Contact Made", "Follow-Up Required", "Appointment Scheduled", "Qualified Opportunity", "Closed / Archived", "Do Not Contact"];
  var STATUS_COLOR = {
    "Not Visited": "#8e9892", "Scheduled for Visit": "#5b8def", "Visited — No Contact": "#c98a1a",
    "Contact Made": "#2aa7a1", "Follow-Up Required": "#d9a400", "Appointment Scheduled": "#7b5cff",
    "Qualified Opportunity": "#18a35a", "Closed / Archived": "#555c58", "Do Not Contact": "#d0372d"
  };
  var VISIT_OUTCOMES = {
    no_answer: "No Answer", nobody_home: "Nobody Home", vacant: "Property Vacant — Unverified",
    spoke_owner: "Spoke With Owner", spoke_tenant: "Spoke With Tenant / Occupant", spoke_other: "Spoke With Other Person",
    access_restricted: "Access Restricted", rescheduled: "Visit Rescheduled"
  };
  var DISPOSITIONS = ["Interested in Selling", "Interested in Listing Consultation", "Maybe / Future Seller", "Not Interested", "Already Listed", "Already Sold", "Keep Property", "Undecided / Unsure", "Wrong Owner / Ownership Unconfirmed", "Do Not Contact"];
  var STAGES = ["Not Worked", "Visit Attempted", "Contact Made", "Interest Verified", "Consultation Booked", "Appointment Completed", "Opportunity", "Agreement Signed", "Closed"];
  var PIPELINES = { field: "Field Prospecting", retail: "Retail", reo: "REO / Asset Mgmt", npn: "Nonperforming Notes", radio: "Radio & Referral" };
  var MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

  // ---------- utils ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uid(p) { return p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function now() { return new Date().toISOString(); }
  function dayKey(d) { var x = d ? new Date(d) : new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); }
  function fmtTime(iso) { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  function fmtDT(iso) { var d = new Date(iso); return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + fmtTime(iso); }
  function fmtDate(k) { if (!k) return "—"; var p = k.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }); }
  function isToday(iso) { return dayKey(iso) === dayKey(); }

  // ---------- seed (synthetic) ----------
  function seed() {
    var streets = ["Larkspur Ct", "Hollow Pine Rd", "Wren Ave", "Quarry Ln", "Juniper Way", "Bayberry Dr", "Old Mill Rd", "Cedar Knoll"];
    var owners = ["D. Ferrante", "K. & L. Osei", "M. Albright", "Estate of R. Vance", "P. Lindqvist", "T. Okafor", "J. Marchetti", "S. Halvorsen", "A. Brandt", "N. Castellanos", "H. Iverson", "C. Delgado"];
    var types = ["Single-family", "Single-family", "Single-family", "Two-family", "Colonial", "Cape", "Ranch"];
    var signals = [
      ["Pre-foreclosure filing (synthetic)", -21], ["Tax delinquency (synthetic)", -45], ["Absentee owner", -120],
      ["Long-term ownership 25y+", -400], ["Expired listing", -30], ["Probate filing (synthetic)", -60], ["Code violation (synthetic)", -15]
    ];
    var props = [];
    for (var i = 0; i < 24; i++) {
      var st = streets[i % streets.length];
      var num = 10 + ((i * 37) % 180);
      var sig = signals[i % signals.length];
      var col = i % 6, rowi = Math.floor(i / 6);
      props.push({
        id: "p" + (i + 1),
        address: num + " " + st, city: "Northfield (demo)", zip: "1199" + (i % 3), nbhd: i < 12 ? "Northfield East" : "Northfield West",
        parcel: "DEMO-" + (2400 + i * 7), type: types[i % types.length],
        owner: { name: owners[i % owners.length], verified: i % 5 === 0, verifySource: i % 5 === 0 ? "County record match (synthetic)" : null },
        contact: { phone: i % 3 === 0 ? null : "(555) 01" + String(10 + i).slice(-2) + "-" + String(1000 + i * 13).slice(-4), source: i % 3 === 0 ? null : "Skip-trace (synthetic)" },
        signals: [{ label: sig[0], date: addDays(sig[1]) }],
        list: "L1", pipeline: "field", agent: AGENT, seq: i + 1,
        stage: 0, dnc: false, noSolicit: i === 14, archived: false, scheduled: i < 3,
        x: 70 + col * 110 + (rowi % 2 ? 22 : 0), y: 70 + rowi * 92
      });
    }
    var extras = [
      { address: "802 Harbor View Blvd", type: "Condo", pipeline: "reo", owner: "Demo Servicer Trust", sig: "Bank-owned (synthetic)" },
      { address: "41 Tamarack Pl", type: "Single-family", pipeline: "npn", owner: "Note: Demo Fund II", sig: "Nonperforming note 180d (synthetic)" },
      { address: "17 Saltmeadow Rd", type: "Ranch", pipeline: "radio", owner: "Caller: G. Pruitt", sig: "Radio-show inquiry (synthetic)" },
      { address: "230 Crestline Dr", type: "Colonial", pipeline: "retail", owner: "B. Wexler", sig: "Retail buyer-side referral (synthetic)" }
    ];
    extras.forEach(function (e, j) {
      props.push({
        id: "x" + (j + 1), address: e.address, city: "Northfield (demo)", zip: "11994", nbhd: "Other channels", parcel: "DEMO-X" + (j + 1), type: e.type,
        owner: { name: e.owner, verified: false, verifySource: null }, contact: { phone: null, source: null },
        signals: [{ label: e.sig, date: addDays(-10 - j) }], list: "L2", pipeline: e.pipeline, agent: AGENT, seq: 100 + j,
        stage: 0, dnc: false, noSolicit: false, archived: false, scheduled: false, x: 0, y: 0
      });
    });

    var events = [], tasks = [], notes = [];
    function ev(propId, type, data, minsAgo, source) {
      var e = { id: uid("e"), propId: propId, type: type, data: data || {}, at: new Date(Date.now() - minsAgo * 60000).toISOString(), agent: AGENT, source: source || "agent" };
      events.push(e); return e;
    }
    // yesterday's history so the today board starts realistic, not empty
    var Y = 60 * 20;
    ev("p4", "visit", { outcome: "no_answer" }, Y + 30); props[3].stage = 1;
    ev("p5", "visit", { outcome: "spoke_owner" }, Y + 20); props[4].stage = 2;
    var d5 = ev("p5", "disposition", { disposition: "Maybe / Future Seller", nextAction: "Call back in two weeks" }, Y + 18);
    tasks.push({ id: uid("t"), propId: "p5", title: "Call back — owner asked for two weeks", due: addDays(0), priority: "high", status: "open", assignee: AGENT, originEventId: d5.id, needsReview: false });
    ev("p6", "visit", { outcome: "spoke_owner" }, Y + 10); props[5].stage = 2;
    ev("p6", "disposition", { disposition: "Not Interested", nextAction: "None — respect decision" }, Y + 9);
    ev("p7", "visit", { outcome: "spoke_owner" }, Y); props[6].stage = 2;
    var d7 = ev("p7", "disposition", { disposition: "Do Not Contact", nextAction: "Suppress" }, Y - 1); props[6].dnc = true;
    tasks.push({ id: uid("t"), propId: "p9", title: "Verify ownership — record name differs from mailbox", due: addDays(1), priority: "normal", status: "open", assignee: ASSISTANT, originEventId: null, needsReview: false, kind: "verify" });
    void d7;

    return {
      v: 1, seededAt: now(),
      lists: [{ id: "L1", name: "Northfield — October knock list", source: "Nextier Data Engine (synthetic)" }, { id: "L2", name: "Other channels intake", source: "Mixed (synthetic)" }],
      props: props, events: events, tasks: tasks, notes: notes, appts: [], sync: [], mappings: {},
      session: { listId: "L1", currentId: null },
      settings: { theme: "system", role: "agent", simulateFailure: false, consentAck: false, pipeline: "all" },
      lastSyncRun: null
    };
  }

  // ---------- store ----------
  var S;
  function load() {
    try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
    if (!S || S.v !== 1) { S = seed(); save(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Could not save on this device"); }
  }
  function prop(id) { return S.props.find(function (p) { return p.id === id; }); }
  function eventsFor(id) { return S.events.filter(function (e) { return e.propId === id; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); }
  function openTasks(id) { return S.tasks.filter(function (t) { return t.status === "open" && (!id || t.propId === id); }); }
  function latest(id, type) { return eventsFor(id).find(function (e) { return e.type === type; }); }
  function addEvent(propId, type, data, source) {
    var e = { id: uid("e"), propId: propId, type: type, data: data || {}, at: now(), agent: S.settings.role === "assistant" ? ASSISTANT : AGENT, source: source || "agent" };
    S.events.push(e);
    return e;
  }

  // Field status is derived from history so list, map and pipeline always agree.
  function status(p) {
    if (p.dnc) return "Do Not Contact";
    if (p.archived) return "Closed / Archived";
    if (p.stage >= 6) return "Qualified Opportunity";
    if (S.appts.some(function (a) { return a.propId === p.id && a.status === "booked"; })) return "Appointment Scheduled";
    if (openTasks(p.id).some(function (t) { return t.kind !== "verify"; })) return "Follow-Up Required";
    var v = latest(p.id, "visit");
    if (v && /^spoke/.test(v.data.outcome)) return "Contact Made";
    if (v) return "Visited — No Contact";
    if (p.scheduled) return "Scheduled for Visit";
    return "Not Visited";
  }
  function bumpStage(p, idx) { if (p.stage < idx) p.stage = idx; }

  // ---------- sync queue (simulated; idempotent per entity) ----------
  var MAP = {
    property: { db: "Properties", fields: [["address", "Name (title)"], ["parcel", "Parcel ID"], ["type", "Property Type"], ["owner.name", "Owner"], ["owner.verified", "Owner Verified (checkbox)"], ["status", "Field Status (select)"], ["stage", "Execution Stage (select)"], ["disposition", "Latest Disposition"], ["nextAction", "Next Action"], ["followUp", "Follow-Up Date"], ["id", "Nextier Source ID (unique)"]] },
    activity: { db: "Visit Activities", fields: [["type", "Activity Type"], ["outcome", "Outcome"], ["summary", "Conversation Summary"], ["agent", "Agent"], ["at", "Timestamp"], ["propId", "Property (relation)"], ["id", "Nextier Source ID (unique)"]] },
    task: { db: "Tasks / Follow-Ups", fields: [["title", "Task"], ["due", "Due"], ["priority", "Priority"], ["status", "Status"], ["propId", "Property (relation)"], ["id", "Nextier Source ID (unique)"]] },
    appointment: { db: "Appointments", fields: [["when", "Date/Time"], ["kind", "Type"], ["propId", "Property (relation)"], ["id", "Nextier Source ID (unique)"]] }
  };
  function enqueue(entity, entityId, label) {
    // Coalesce: one pending upsert per entity — a revisit never creates a second property record.
    var existing = S.sync.find(function (q) { return q.entity === entity && q.entityId === entityId && q.status !== "simulated"; });
    if (existing) { existing.at = now(); existing.label = label; existing.status = "pending"; existing.error = null; return; }
    S.sync.push({ id: uid("q"), entity: entity, entityId: entityId, label: label, op: S.mappings[entity + ":" + entityId] ? "update" : "create", status: "pending", attempts: 0, error: null, at: now(), key: entity + ":" + entityId });
  }
  function runSync(onlyFailed) {
    var items = S.sync.filter(function (q) { return onlyFailed ? q.status === "failed" : (q.status === "pending" || q.status === "failed"); });
    if (!items.length) { toast("Nothing to sync"); return; }
    if (!navigator.onLine) { toast("Offline — queue kept on this device"); return; }
    var fails = 0;
    items.forEach(function (q, i) {
      q.attempts++;
      if (S.settings.simulateFailure && i % 2 === 0) {
        q.status = "failed"; q.error = "Simulated 409: Notion property 'Field Status' option missing"; fails++;
      } else {
        var k = q.entity + ":" + q.entityId;
        if (!S.mappings[k]) S.mappings[k] = "sim_" + Math.random().toString(36).slice(2, 10);
        q.op = "update"; q.status = "simulated"; q.error = null; q.doneAt = now();
      }
    });
    S.lastSyncRun = now();
    save(); render();
    toast(fails ? fails + " failed · " + (items.length - fails) + " simulated (not sent)" : items.length + " simulated — nothing was sent to Notion");
  }

  // ---------- rule-based extraction (demo stand-in; never invents facts) ----------
  function nextMonthDate(m) {
    var d = new Date(); var y = d.getFullYear(); if (m < d.getMonth() || (m === d.getMonth())) y++;
    return y + "-" + String(m + 1).padStart(2, "0") + "-01";
  }
  function extract(text) {
    var t = " " + text.toLowerCase().replace(/\s+/g, " ") + " ";
    var sentences = text.split(/(?<=[.!?])\s+/);
    function evidence(re) { var s = sentences.find(function (x) { return re.test(x.toLowerCase()); }); return s ? s.trim() : null; }
    var out = { who: null, disposition: null, timing: null, followUp: null, followUpExact: false, condition: null, nextAction: null, review: [] };

    if (/spoke (with|to) (the )?owner|owner (said|says|told)|homeowner|she owns|he owns/.test(t)) out.who = { v: "Owner (agent-stated)", ev: evidence(/owner|owns/) };
    else if (/tenant|renter|occupant/.test(t)) out.who = { v: "Tenant / occupant", ev: evidence(/tenant|renter|occupant/) };
    else if (/son|daughter|husband|wife|neighbor|relative/.test(t)) out.who = { v: "Other person", ev: evidence(/son|daughter|husband|wife|neighbor|relative/) };

    var dRules = [
      [/do not (contact|come)|don't (contact|come back|knock)|stop (contacting|coming)|take me off|no more visits/, "Do Not Contact"],
      [/already (listed|on the market)|has (a|an) (agent|listing)/, "Already Listed"],
      [/already sold|under contract|just sold/, "Already Sold"],
      [/wrong (owner|person|house)|doesn'?t own|not the owner/, "Wrong Owner / Ownership Unconfirmed"],
      [/keep(ing)? (the )?(house|property|home)|never sell|staying put/, "Keep Property"],
      [/(listing|list) (consult|appointment|meeting)|wants? to (meet|sit down)|come (by|over) and (look|see)/, "Interested in Listing Consultation"],
      [/(thinking about|considering|maybe|might|possibly) (sell|selling|listing)|sell(ing)? (in|next|by) (the )?(spring|summer|fall|winter|year|\w+)/, "Maybe / Future Seller"],
      [/(wants?|ready|looking) to sell|interested in selling|selling (now|soon|asap)/, "Interested in Selling"],
      [/not interested|no interest/, "Not Interested"],
      [/(not sure|unsure|undecided|on the fence)/, "Undecided / Unsure"]
    ];
    for (var i = 0; i < dRules.length; i++) {
      if (dRules[i][0].test(t)) { out.disposition = { v: dRules[i][1], ev: evidence(dRules[i][0]) }; break; }
    }
    // "Not interested in listing right now" + future intent → still future seller, flagged for review
    if (out.disposition && out.disposition.v === "Maybe / Future Seller" && /not interested/.test(t)) out.review.push("Mixed signals: future selling intent and 'not interested' both stated — confirm disposition.");

    var season = t.match(/\b(spring|summer|fall|autumn|winter|next year|after the holidays)\b/);
    if (season) out.timing = { v: season[1].replace(/^\w/, function (c) { return c.toUpperCase(); }), ev: evidence(new RegExp(season[1])) };

    var mm = null;
    MONTHS.forEach(function (m, idx) { if (!mm && new RegExp("\\b(in|call (her|him|them|me)? ?in|by|early|mid|late)? ?" + m + "\\b").test(t)) mm = idx; });
    var rel = t.match(/\b(in|after) (two|2|three|3|a couple of|one|1) weeks?\b|\bnext week\b|\btomorrow\b|\bin (a|one|1|two|2|three|3|six|6) months?\b/);
    if (mm !== null) {
      out.followUp = { v: nextMonthDate(mm), ev: evidence(new RegExp(MONTHS[mm])) };
      out.review.push("'" + MONTHS[mm].replace(/^\w/, function (c) { return c.toUpperCase(); }) + "' has no specific day — follow-up set to the 1st; adjust if needed.");
    } else if (rel) {
      var r = rel[0], days = 14;
      if (/tomorrow/.test(r)) days = 1; else if (/next week/.test(r)) days = 7;
      else if (/three|3/.test(r) && /week/.test(r)) days = 21; else if (/(one|1|a) (week)/.test(r)) days = 7;
      else if (/month/.test(r)) days = /six|6/.test(r) ? 182 : /three|3/.test(r) ? 91 : /two|2/.test(r) ? 61 : 30;
      out.followUp = { v: addDays(days), ev: evidence(/week|month|tomorrow/) };
      out.followUpExact = /tomorrow|next week/.test(r);
    } else if (out.timing) {
      out.review.push("Timing '" + out.timing.v + "' mentioned but no follow-up date stated — pick one or leave unset.");
    }
    if (/call (her|him|them|me|back)|callback|call back|reach out/.test(t) && !out.followUp) out.review.push("Callback requested but no date given — choose a date.");

    var cond = t.match(/needs? (some |a lot of |major )?(work|repairs?|updating|a new roof|tlc)|(roof|kitchen|foundation|boiler|windows?) (is |are )?(old|bad|leaking|needs)|recently (renovated|updated)|move-?in ready/);
    if (cond) out.condition = { v: cond[0].replace(/^\w/, function (c) { return c.toUpperCase(); }) + " — unverified until assessed", ev: evidence(/work|repair|roof|kitchen|foundation|boiler|window|renovat|updated|move-?in/) };

    var d = out.disposition && out.disposition.v;
    if (d === "Do Not Contact") out.nextAction = "Suppress all outreach";
    else if (d === "Not Interested" || d === "Keep Property" || d === "Already Sold") out.nextAction = "No follow-up — record and respect";
    else if (d === "Already Listed") out.nextAction = "Note listing; no solicitation";
    else if (d === "Wrong Owner / Ownership Unconfirmed") out.nextAction = "Create ownership verification task";
    else if (d === "Interested in Selling" || d === "Interested in Listing Consultation") out.nextAction = "Flag for agent review and book consultation";
    else if (out.followUp) out.nextAction = "Schedule follow-up call " + fmtDate(out.followUp.v);
    else if (d) out.nextAction = "Choose a follow-up date or nurture review";

    if (!d) out.review.push("No clear disposition found in the note — choose one.");
    return out;
  }

  // ---------- UI helpers ----------
  var toastTimer;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }
  function chipFor(st) {
    var cls = { "Do Not Contact": "bad", "Qualified Opportunity": "ok", "Appointment Scheduled": "info", "Follow-Up Required": "warn", "Contact Made": "ok" }[st] || "";
    return '<span class="chip ' + cls + '"><span class="dot" style="background:' + STATUS_COLOR[st] + '"></span>' + esc(st) + "</span>";
  }
  function ownerChip(p) { return p.owner.verified ? '<span class="chip ok">Owner verified</span>' : '<span class="chip warn">Owner unverified</span>'; }
  function propsInScope() {
    var pl = S.settings.pipeline;
    return S.props.filter(function (p) { return pl === "all" || p.pipeline === pl; });
  }
  function fieldQueue() {
    return S.props.filter(function (p) { return p.list === S.session.listId && !p.archived; }).sort(function (a, b) { return a.seq - b.seq; });
  }
  function nextProp() {
    return fieldQueue().find(function (p) { var s = status(p); return !p.dnc && (s === "Not Visited" || s === "Scheduled for Visit"); });
  }

  // ---------- sheet (modal) with focus management ----------
  var lastFocus;
  function openSheet(title, html, onMount, opts) {
    lastFocus = document.activeElement;
    var root = $("#sheetRoot");
    root.innerHTML = '<div class="sheet-backdrop" data-close="1"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">' +
      '<div class="sheet-grip" aria-hidden="true"></div><div class="sheet-head"><h3 id="sheetTitle">' + esc(title) + '</h3>' +
      '<button class="btn small ghost" data-close="1" aria-label="Close">Close</button></div><div class="sheet-body">' + html + "</div></div></div>";
    var bd = $(".sheet-backdrop", root);
    bd.addEventListener("click", function (e) { if (e.target.getAttribute("data-close") && !(opts && opts.locked)) closeSheet(); });
    if (onMount) onMount($(".sheet", root));
    var f = $(".sheet [autofocus]", root) || $(".sheet button, .sheet input, .sheet select, .sheet textarea", root);
    if (f) f.focus();
  }
  function closeSheet() {
    if (activeRec) activeRec.cancel();
    $("#sheetRoot").innerHTML = "";
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("#sheetRoot").innerHTML) closeSheet();
    if (e.key === "Tab" && $("#sheetRoot .sheet")) {
      var f = $$("#sheetRoot .sheet button:not(:disabled), #sheetRoot .sheet input, #sheetRoot .sheet select, #sheetRoot .sheet textarea, #sheetRoot .sheet a[href]");
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // ---------- views ----------
  function todayStats() {
    var te = S.events.filter(function (e) { return isToday(e.at); });
    var visits = te.filter(function (e) { return e.type === "visit"; });
    var convo = visits.filter(function (e) { return /^spoke/.test(e.data.outcome); });
    var q = fieldQueue();
    return {
      assigned: q.length,
      visited: new Set(visits.map(function (e) { return e.propId; })).size,
      knocks: te.filter(function (e) { return e.type === "knock"; }).length,
      convo: convo.length,
      owners: convo.filter(function (e) { return e.data.outcome === "spoke_owner"; }).length,
      notes: S.notes.filter(function (n) { return isToday(n.at); }).length,
      followups: S.tasks.filter(function (t) { return t.createdAt && isToday(t.createdAt); }).length,
      apptsBooked: S.appts.filter(function (a) { return isToday(a.createdAt); }).length,
      apptsDone: S.appts.filter(function (a) { return a.status === "completed" && isToday(a.doneAt || a.createdAt); }).length,
      opps: te.filter(function (e) { return e.type === "stage" && e.data.to >= 6; }).length
    };
  }

  function viewToday() {
    var st = todayStats(), role = S.settings.role;
    var due = openTasks().filter(function (t) { return t.due && t.due <= dayKey(); });
    var np = nextProp();
    var last = S.events.filter(function (e) { return e.type === "visit"; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0];
    var review = S.notes.filter(function (n) { return !n.confirmed; });
    var failed = S.sync.filter(function (q) { return q.status === "failed"; });
    var verify = openTasks().filter(function (t) { return t.kind === "verify" || /verify ownership/i.test(t.title); });
    var attention = S.props.filter(function (p) { var e = latest(p.id, "disposition"); return !p.dnc && e && /Interested in/.test(e.data.disposition) && p.stage < 4; });

    var h = '<p class="eyebrow">' + esc(new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })) + " · " + (role === "agent" ? "Agent view" : role === "assistant" ? "Assistant view" : "Manager view") + "</p>";
    h += "<h1>Field Command</h1>";

    if (role === "agent") {
      h += '<div class="kpis" style="margin-top:12px"><div class="kpi"><b>' + st.assigned + "</b><span>On today's list</span></div><div class=\"kpi\"><b>" + st.visited + '</b><span>Visited today</span></div><div class="kpi"><b>' + due.length + "</b><span>Follow-ups due</span></div></div>";
      h += "<h2>Where to next</h2>";
      if (np) {
        h += '<div class="card hero"><div class="row between"><span class="eyebrow">Next property · #' + np.seq + "</span>" + chipFor(status(np)) + '</div><div class="addr">' + esc(np.address) + '</div><p class="sub">' + esc(np.type) + " · " + esc(np.nbhd) + " · " + esc(np.signals[0].label) + "</p>" +
          (np.noSolicit ? '<div class="callout warn" style="margin:8px 0">No-solicitation notice recorded at this address.</div>' : "") +
          '<div class="grid2" style="margin-top:12px"><a class="btn primary" href="#/field">Start Drive &amp; Knock</a><a class="btn" href="#/p/' + np.id + '">Property details</a></div></div>';
      } else h += '<div class="card empty">Every property on this list has been worked. <a href="#/book">Open Property Book</a></div>';

      h += "<h2>Follow-ups due</h2>";
      h += due.length ? '<div class="list">' + due.slice(0, 4).map(taskCard).join("") + "</div>" : '<div class="card empty">No follow-ups due today.</div>';

      h += "<h2>Last visit</h2>";
      if (last) { var lp = prop(last.propId); var ld = latest(lp.id, "disposition"); h += '<a class="card" href="#/p/' + lp.id + '"><div class="row between"><b>' + esc(lp.address) + '</b><span class="mono muted" style="font-size:12px">' + fmtDT(last.at) + '</span></div><p class="sub">' + esc(VISIT_OUTCOMES[last.data.outcome]) + (ld ? " · " + esc(ld.data.disposition) : "") + "</p></a>"; }
      else h += '<div class="card empty">No visits yet.</div>';

      h += "<h2>Needs your attention</h2>";
      var att = attention.map(function (p) { return '<a class="card tight" href="#/p/' + p.id + '"><b>' + esc(p.address) + '</b><p class="sub">Interest stated — consultation not booked</p></a>'; });
      if (review.length) att.unshift('<a class="card tight" href="#/notes"><b>' + review.length + ' voice note(s) not confirmed</b><p class="sub">Review before anything is committed</p></a>');
      h += att.length ? '<div class="list">' + att.join("") + "</div>" : '<div class="card empty">Nothing waiting on you.</div>';

      h += "<h2>Today's output</h2>" + outputKpis(st);
    } else if (role === "assistant") {
      h += "<h2>Transcription review</h2>" + (review.length ? '<div class="list">' + review.map(noteCard).join("") + "</div>" : '<div class="card empty">No notes waiting for review.</div>');
      h += "<h2>Ownership verification</h2>" + (verify.length ? '<div class="list">' + verify.map(taskCard).join("") + "</div>" : '<div class="card empty">No verification tasks.</div>');
      var missing = S.props.filter(function (p) { return !p.contact.phone && !p.dnc; });
      h += "<h2>Missing contact info · " + missing.length + "</h2>" + '<div class="list">' + missing.slice(0, 6).map(propRow).join("") + "</div>";
      h += "<h2>CRM sync exceptions</h2>" + (failed.length ? '<div class="list">' + failed.map(function (q) { return '<a class="card tight" href="#/sync"><b>' + esc(q.label) + '</b><p class="sub" style="color:var(--danger)">' + esc(q.error) + "</p></a>"; }).join("") + "</div>" : '<div class="card empty">No sync failures.</div>');
    } else {
      var overdue = openTasks().filter(function (t) { return t.due && t.due < dayKey(); });
      h += "<h2>Execution output · today</h2>" + outputKpis(st);
      h += "<h2>Pipeline movement</h2>" + '<div class="kpis small">' + STAGES.map(function (s, i) { var n = propsInScope().filter(function (p) { return p.stage === i; }).length; return '<div class="kpi"><b>' + n + "</b><span>" + esc(s) + "</span></div>"; }).join("") + "</div>";
      h += "<h2>Missed follow-ups · " + overdue.length + "</h2>" + (overdue.length ? '<div class="list">' + overdue.map(taskCard).join("") + "</div>" : '<div class="card empty">No overdue follow-ups.</div>');
      var load = {}; openTasks().forEach(function (t) { load[t.assignee] = (load[t.assignee] || 0) + 1; });
      h += "<h2>Operator capacity</h2><div class=\"card\">" + (Object.keys(load).length ? Object.keys(load).map(function (k) { return '<div class="row between" style="padding:4px 0"><span>' + esc(k) + '</span><b class="mono">' + load[k] + " open</b></div>"; }).join("") : '<p class="muted">No open tasks.</p>') + "</div>";
    }
    return h;
  }
  function outputKpis(st) {
    var rows = [["Assigned", st.assigned], ["Visited", st.visited], ["Doors knocked", st.knocks], ["Conversations", st.convo], ["Owners contacted", st.owners], ["Voice notes", st.notes], ["Follow-ups created", st.followups], ["Appts booked", st.apptsBooked], ["Appts completed", st.apptsDone], ["Opps verified", st.opps]];
    return '<div class="kpis small">' + rows.map(function (r) { return '<div class="kpi"><b>' + r[1] + "</b><span>" + r[0] + "</span></div>"; }).join("") + "</div>";
  }
  function taskCard(t) {
    var p = prop(t.propId);
    var od = t.due && t.due < dayKey();
    return '<div class="card tight"><div class="row between"><b>' + esc(t.title) + "</b>" + (t.needsReview ? '<span class="chip warn">Review</span>' : "") + '</div><p class="sub">' + (p ? '<a href="#/p/' + p.id + '">' + esc(p.address) + "</a> · " : "") + "Due " + esc(fmtDate(t.due)) + (od ? ' <span class="chip bad">Overdue</span>' : "") + " · " + esc(t.priority) + " · " + esc(t.assignee) + '</p><div class="row" style="margin-top:6px"><button class="btn small" data-act="task-done" data-id="' + t.id + '">Mark done</button></div></div>';
  }
  function noteCard(n) {
    var p = prop(n.propId);
    return '<div class="card tight"><div class="row between"><b>' + esc(p ? p.address : "Unlinked") + '</b><span class="mono muted" style="font-size:12px">' + fmtDT(n.at) + '</span></div><p class="sub">' + esc(n.transcript.slice(0, 120)) + (n.transcript.length > 120 ? "…" : "") + '</p><div class="row">' + (n.confirmed ? '<span class="chip ok">Confirmed by ' + esc(n.confirmedBy) + "</span>" : '<button class="btn small primary" data-act="review-note" data-id="' + n.id + '">Review &amp; confirm</button>') + '<span class="chip">' + esc(n.transcriptSource) + "</span></div></div>";
  }
  function propRow(p) {
    var st = status(p);
    return '<a class="card tight prop-row" href="#/p/' + p.id + '"><span class="dot" style="background:' + STATUS_COLOR[st] + ';width:12px;height:12px"></span><span><span class="addr-s">' + esc(p.address) + '</span><br><span class="meta">' + esc(p.owner.name) + (p.owner.verified ? "" : " (unverified)") + " · " + esc(PIPELINES[p.pipeline]) + '</span></span><span class="meta mono">' + (p.seq < 100 ? "#" + p.seq : "") + "</span></a>";
  }

  var bookState = { q: "", status: "all" };
  function viewBook() {
    var q = bookState.q.trim().toLowerCase();
    var rows = propsInScope().filter(function (p) {
      if (bookState.status !== "all" && status(p) !== bookState.status) return false;
      if (!q) return true;
      return [p.address, p.owner.name, p.zip, p.nbhd, p.parcel].join(" ").toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return a.seq - b.seq; });
    var h = "<h1>Property Book</h1><p class=\"sub\">" + S.props.length + " properties · " + S.lists.length + " lists · data is synthetic</p>";
    h += pipelineSeg();
    h += '<div class="field" style="margin-top:12px"><label for="bookQ" class="sr">Search</label><input id="bookQ" type="search" placeholder="Address, owner, ZIP, neighborhood, parcel" value="' + esc(bookState.q) + '"></div>';
    h += '<div class="field"><label for="bookStatus" class="sr">Status</label><select id="bookStatus"><option value="all">All statuses</option>' + FIELD_STATUS.map(function (s) { return '<option' + (bookState.status === s ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select></div>";
    h += '<div class="grid2" style="margin-bottom:12px"><button class="btn" data-act="add-prop">+ Add property</button><label class="btn" for="csvIn" tabindex="0">Import CSV</label><input id="csvIn" type="file" accept=".csv,text/csv" hidden></div>';
    h += '<div class="list">' + (rows.length ? rows.map(propRow).join("") : '<div class="card empty">No matching properties.</div>') + "</div>";
    return h;
  }
  function pipelineSeg() {
    var pl = S.settings.pipeline;
    return '<div class="seg" role="group" aria-label="Pipeline filter"><button data-act="pipe" data-v="all" aria-pressed="' + (pl === "all") + '">All</button>' + Object.keys(PIPELINES).map(function (k) { return '<button data-act="pipe" data-v="' + k + '" aria-pressed="' + (pl === k) + '">' + esc(PIPELINES[k]) + "</button>"; }).join("") + "</div>";
  }

  function viewMap() {
    var ps = S.props.filter(function (p) { return p.list === "L1"; });
    var svg = '<svg viewBox="0 0 720 420" role="img" aria-label="Schematic territory map of the October knock list">';
    svg += '<rect width="720" height="420" fill="var(--surface-2)"/>';
    for (var r = 0; r < 4; r++) svg += '<rect x="20" y="' + (110 + r * 92 - 22) + '" width="680" height="10" rx="5" fill="var(--line)"/>';
    for (var c = 0; c < 7; c++) svg += '<rect x="' + (15 + c * 110) + '" y="20" width="10" height="380" rx="5" fill="var(--line)"/>';
    var np = nextProp();
    var route = fieldQueue().filter(function (p) { return p.list === "L1"; }).map(function (p) { return p.x + "," + p.y; }).join(" ");
    svg += '<polyline points="' + route + '" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 5" opacity=".6"/>';
    ps.forEach(function (p) {
      var st = status(p), isNext = np && np.id === p.id;
      svg += '<a href="#/p/' + p.id + '" aria-label="' + esc(p.address + ", " + st) + '"><g>' + (isNext ? '<circle cx="' + p.x + '" cy="' + p.y + '" r="19" fill="none" stroke="var(--accent)" stroke-width="3"/>' : "") +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="13" fill="' + STATUS_COLOR[st] + '" stroke="var(--surface)" stroke-width="2"/><text x="' + p.x + '" y="' + (p.y + 4) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="IBM Plex Mono, monospace">' + p.seq + "</text></g></a>";
    });
    svg += "</svg>";
    var used = {}; ps.forEach(function (p) { used[status(p)] = 1; });
    var h = "<h1>Field Map</h1><p class=\"sub\">Schematic territory view (synthetic positions). Production renders on Mapbox via the Nextier backend.</p>";
    h += '<div class="map-wrap">' + svg + '<div class="map-legend">' + FIELD_STATUS.filter(function (s) { return used[s]; }).map(function (s) { return '<span><span class="dot" style="background:' + STATUS_COLOR[s] + '"></span>' + esc(s) + "</span>"; }).join("") + '<span><span class="dot" style="border:2px solid var(--accent)"></span>Next stop</span></div></div>';
    h += '<div class="grid2" style="margin-top:12px"><a class="btn primary" href="#/field">Start Drive &amp; Knock</a><a class="btn" href="#/book">List view</a></div>';
    return h;
  }

  function viewProp(id) {
    var p = prop(id); if (!p) return '<div class="card empty">Property not found. <a href="#/book">Back to Property Book</a></div>';
    var st = status(p), disp = latest(p.id, "disposition"), tasks = openTasks(p.id);
    var h = '<p class="eyebrow"><a href="#/book">Property Book</a> · ' + esc(PIPELINES[p.pipeline]) + "</p>";
    h += '<div class="addr" style="font-size:26px">' + esc(p.address) + '</div><p class="sub">' + esc(p.city) + " " + esc(p.zip) + " · " + esc(p.type) + ' · Parcel <span class="mono">' + esc(p.parcel) + "</span></p>";
    h += '<div class="row" style="margin:8px 0 4px">' + chipFor(st) + ownerChip(p) + '<span class="chip">Stage: ' + esc(STAGES[p.stage]) + "</span>" + syncChip("property", p.id) + "</div>";
    if (p.dnc) h += '<div class="callout bad" style="margin-top:10px">Do Not Contact — field actions and outreach are suppressed for this property.</div>';
    if (p.noSolicit) h += '<div class="callout warn" style="margin-top:10px">No-solicitation notice recorded. Do not knock.</div>';

    h += "<h2>Why it's being worked</h2><div class=\"card tight\">" + p.signals.map(function (s) { return "<div class=\"row between\"><span>" + esc(s.label) + '</span><span class="mono muted" style="font-size:12px">' + esc(fmtDate(s.date)) + "</span></div>"; }).join("") + '<p class="sub" style="margin-top:6px">List: ' + esc((S.lists.find(function (l) { return l.id === p.list; }) || {}).name) + "</p></div>";

    h += "<h2>Current disposition &amp; next step</h2><div class=\"card tight\">" + (disp ? "<b>" + esc(disp.data.disposition) + '</b><span class="src' + (disp.source === "ai-confirmed" ? " ai" : "") + '">' + esc(srcLabel(disp.source)) + '</span><p class="sub">Next: ' + esc(disp.data.nextAction || "—") + " · set by " + esc(disp.agent) + " " + fmtDT(disp.at) + "</p>" : '<p class="muted">No disposition yet.</p>') + "</div>";

    h += "<h2>Owner</h2><div class=\"card tight\"><b>" + esc(p.owner.name) + "</b> " + ownerChip(p) + '<p class="sub">' + (p.owner.verified ? "Verified via " + esc(p.owner.verifySource) : "Imported name only — not confirmed as current owner.") + "</p>" +
      '<p class="sub">Phone: ' + (p.contact.phone ? '<span class="mono">' + esc(p.contact.phone) + "</span> · source " + esc(p.contact.source) : "none on file") + "</p>" +
      (p.owner.verified ? "" : '<button class="btn small" data-act="verify-task" data-id="' + p.id + '">Create verification task</button>') + "</div>";

    if (tasks.length) h += "<h2>Open follow-ups</h2><div class=\"list\">" + tasks.map(taskCard).join("") + "</div>";

    h += '<div class="grid2" style="margin-top:16px"><button class="btn primary" data-act="work-here" data-id="' + p.id + '"' + (p.dnc ? " disabled" : "") + '>Work this property</button><button class="btn" data-act="record" data-id="' + p.id + '"' + (p.dnc ? " disabled" : "") + ">Record note</button></div>";
    if (p.stage >= 3 && p.stage < 8 && !p.dnc) h += '<button class="btn block" style="margin-top:8px" data-act="advance" data-id="' + p.id + '">Advance stage (requires confirmation)</button>';

    h += "<h2>History</h2>" + timeline(p.id);
    return h;
  }
  function srcLabel(s) { return { agent: "Agent", "ai-confirmed": "AI-suggested · agent-confirmed", system: "System" }[s] || s; }
  function syncChip(entity, id) {
    var q = S.sync.find(function (x) { return x.entity === entity && x.entityId === id; });
    if (!q) return '<span class="chip">CRM: not queued</span>';
    if (q.status === "pending") return '<span class="chip warn">CRM: pending</span>';
    if (q.status === "failed") return '<span class="chip bad">CRM: failed</span>';
    return '<span class="chip info">CRM: simulated (not sent)</span>';
  }
  function timeline(pid) {
    var evs = eventsFor(pid);
    if (!evs.length) return '<div class="card empty">No history yet.</div>';
    return '<ul class="timeline">' + evs.map(function (e) {
      var t = "", body = "";
      if (e.type === "arrived") { t = "Arrival logged"; body = "Arrival is not proof of a visit."; }
      else if (e.type === "knock") t = "Door-knock attempt";
      else if (e.type === "visit") t = "Visit outcome: " + VISIT_OUTCOMES[e.data.outcome];
      else if (e.type === "disposition") { t = "Disposition: " + e.data.disposition; body = "Next: " + (e.data.nextAction || "—"); }
      else if (e.type === "note") { var n = S.notes.find(function (x) { return x.id === e.data.noteId; }); t = "Voice note"; body = n ? "Transcript: “" + n.transcript + "”" + (n.summary ? "<br><b>Summary:</b> " + esc(n.summary) : "") : ""; return '<li class="k-note"><div class="when">' + fmtDT(e.at) + " · " + esc(e.agent) + '<span class="src">' + esc(srcLabel(e.source)) + "</span></div><b>" + esc(t) + "</b><div class=\"sub\">" + (n ? "Transcript: “" + esc(n.transcript) + "”" + (n.summary ? "<br><b>Summary:</b> " + esc(n.summary) : "") + (n.audio ? "<br>Audio: kept for this browser session only" : "<br>Audio: none captured") : "") + "</div></li>"; }
      else if (e.type === "task") t = "Task created: " + e.data.title;
      else if (e.type === "appointment") { t = "Appointment booked"; body = e.data.when; }
      else if (e.type === "stage") t = "Stage → " + STAGES[e.data.to];
      else if (e.type === "suppressed") t = "Outreach suppressed (Do Not Contact)";
      else t = e.type;
      return '<li class="k-' + e.type + '"><div class="when">' + fmtDT(e.at) + " · " + esc(e.agent) + '<span class="src' + (e.source === "ai-confirmed" ? " ai" : "") + '">' + esc(srcLabel(e.source)) + "</span></div><b>" + esc(t) + "</b>" + (body ? '<div class="sub">' + esc(body) + "</div>" : "") + "</li>";
    }).join("") + "</ul>";
  }

  // Drive & Knock
  function viewField() {
    var list = S.lists.find(function (l) { return l.id === S.session.listId; });
    var cur = S.session.currentId ? prop(S.session.currentId) : null;
    if (cur && (cur.dnc || cur.archived)) cur = null;
    if (!cur) { cur = nextProp(); S.session.currentId = cur ? cur.id : null; save(); }
    var q = fieldQueue(), done = q.filter(function (p) { return status(p) !== "Not Visited" && status(p) !== "Scheduled for Visit"; }).length;
    var h = '<p class="eyebrow">Drive &amp; Knock · field session</p><h1>' + esc(list ? list.name : "No list") + "</h1>";
    h += '<div class="field"><label for="listSel" class="sr">Property list</label><select id="listSel">' + S.lists.map(function (l) { return '<option value="' + l.id + '"' + (l.id === S.session.listId ? " selected" : "") + ">" + esc(l.name) + "</option>"; }).join("") + "</select></div>";
    h += '<p class="sub">' + done + " of " + q.length + " worked</p>";
    if (!cur) return h + '<div class="card empty">This list is fully worked. Pick another list or review <a href="#/tasks">follow-ups</a>.</div>';

    var lastV = latest(cur.id, "visit"), arrived = eventsFor(cur.id).find(function (e) { return e.type === "arrived" && isToday(e.at); });
    var blocked = cur.noSolicit;
    h += '<div class="card hero"><div class="row between"><span class="eyebrow">Stop #' + cur.seq + "</span>" + chipFor(status(cur)) + '</div><div class="addr">' + esc(cur.address) + '</div><p class="sub">' + esc(cur.type) + " · " + esc(cur.owner.name) + (cur.owner.verified ? "" : " (unverified)") + "</p>" +
      '<p class="sub">Why: ' + esc(cur.signals[0].label) + (lastV ? " · Last: " + esc(VISIT_OUTCOMES[lastV.data.outcome]) : "") + "</p>" +
      (arrived ? '<span class="chip info">Arrived ' + fmtTime(arrived.at) + "</span>" : "") +
      (blocked ? '<div class="callout warn" style="margin-top:8px">No-solicitation notice recorded. Knocking is disabled — log "Access Restricted" or skip.</div>' : "") + "</div>";

    h += '<div class="actions" style="margin-top:12px">' +
      act("arrived", "Arrived", cur.id) +
      act("no_answer", "No Answer", cur.id, blocked) +
      act("spoke_owner", "Spoke to Owner", cur.id, blocked, "go") +
      act("spoke_other", "Spoke to Other", cur.id, blocked) +
      '<button class="act rec" data-act="record" data-id="' + cur.id + '"><span class="mic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span>Record Voice Note</button>' +
      act("followup", "Schedule Follow-Up", cur.id) +
      act("appt", "Book Appointment", cur.id) +
      act("more", "More Outcomes", cur.id) +
      act("next", "Next Property →", cur.id, false, "go") +
      "</div>";
    h += '<p class="sub" style="margin-top:12px">Manual logging — no GPS tracking. Respect posted notices and any request not to be contacted.</p>';
    h += "<h2>Up next</h2><div class=\"list\">" + q.filter(function (p) { return p.id !== cur.id && !p.dnc && (status(p) === "Not Visited" || status(p) === "Scheduled for Visit"); }).slice(0, 4).map(propRow).join("") + "</div>";
    return h;
  }
  function act(a, label, id, disabled, cls) {
    return '<button class="act ' + (cls || "") + '" data-act="f-' + a + '" data-id="' + id + '"' + (disabled ? ' disabled aria-disabled="true"' : "") + ">" + esc(label) + "</button>";
  }

  var taskView = "list";
  function viewTasks() {
    var open = openTasks().sort(function (a, b) { return (a.due || "9") < (b.due || "9") ? -1 : 1; });
    var h = "<h1>Follow-Ups</h1><p class=\"sub\">" + open.length + " open · " + S.appts.filter(function (a) { return a.status === "booked"; }).length + " appointments booked</p>";
    h += '<div class="seg" role="group" aria-label="View"><button data-act="tview" data-v="list" aria-pressed="' + (taskView === "list") + '">List</button><button data-act="tview" data-v="cal" aria-pressed="' + (taskView === "cal") + '">Calendar</button></div>';
    var appts = S.appts.filter(function (a) { return a.status === "booked"; });
    if (taskView === "list") {
      if (appts.length) h += "<h2>Appointments</h2><div class=\"list\">" + appts.map(apptCard).join("") + "</div>";
      h += "<h2>Tasks</h2>" + (open.length ? '<div class="list">' + open.map(taskCard).join("") + "</div>" : '<div class="card empty">No open follow-ups.</div>');
    } else {
      var days = {};
      open.forEach(function (t) { (days[t.due || "Unscheduled"] = days[t.due || "Unscheduled"] || []).push(taskCard(t)); });
      appts.forEach(function (a) { var k = a.date; (days[k] = days[k] || []).push(apptCard(a)); });
      var keys = Object.keys(days).sort();
      h += keys.length ? keys.map(function (k) { return "<h2>" + esc(k === "Unscheduled" ? k : fmtDate(k)) + '</h2><div class="list">' + days[k].join("") + "</div>"; }).join("") : '<div class="card empty" style="margin-top:12px">Nothing scheduled.</div>';
    }
    return h;
  }
  function apptCard(a) {
    var p = prop(a.propId);
    return '<div class="card tight"><div class="row between"><b>' + esc(a.kind) + '</b><span class="chip info">' + esc(fmtDate(a.date)) + " " + esc(a.time) + '</span></div><p class="sub"><a href="#/p/' + p.id + '">' + esc(p.address) + '</a> · confirmed by ' + esc(a.by) + '</p><div class="row"><button class="btn small" data-act="appt-done" data-id="' + a.id + '">Mark completed</button></div></div>';
  }

  var pipeView = "kanban";
  function viewPipeline() {
    var ps = propsInScope();
    var h = "<h1>Pipeline</h1>" + pipelineSeg();
    h += '<div class="seg" role="group" aria-label="View" style="margin-top:8px">' + [["kanban", "Kanban"], ["list", "List"], ["timeline", "Timeline"], ["map", "Map"]].map(function (v) { return '<button data-act="pview" data-v="' + v[0] + '" aria-pressed="' + (pipeView === v[0]) + '">' + v[1] + "</button>"; }).join("") + "</div>";
    if (pipeView === "kanban") {
      h += '<div class="kanban" style="margin-top:14px">' + STAGES.map(function (s, i) {
        var col = ps.filter(function (p) { return p.stage === i && !p.dnc; });
        return '<div class="kcol"><h4><span>' + esc(s) + "</span><span>" + col.length + "</span></h4>" + col.map(function (p) { var d = latest(p.id, "disposition"); return '<a class="kcard" href="#/p/' + p.id + '"><b>' + esc(p.address) + '</b><br><span class="muted">' + esc(d ? d.data.disposition : status(p)) + "</span></a>"; }).join("") + "</div>";
      }).join("") + "</div>";
      var dnc = ps.filter(function (p) { return p.dnc; });
      if (dnc.length) h += "<h2>Suppressed · Do Not Contact</h2><div class=\"list\">" + dnc.map(propRow).join("") + "</div>";
    } else if (pipeView === "list") {
      h += '<div class="list" style="margin-top:12px">' + ps.slice().sort(function (a, b) { return b.stage - a.stage || a.seq - b.seq; }).map(propRow).join("") + "</div>";
    } else if (pipeView === "timeline") {
      var evs = S.events.filter(function (e) { var p = prop(e.propId); return p && ps.indexOf(p) >= 0; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 40);
      h += '<ul class="timeline" style="margin-top:14px">' + evs.map(function (e) { var p = prop(e.propId); var lbl = e.type === "visit" ? VISIT_OUTCOMES[e.data.outcome] : e.type === "disposition" ? e.data.disposition : e.type === "stage" ? "Stage → " + STAGES[e.data.to] : e.type === "task" ? "Task: " + e.data.title : e.type; return '<li class="k-' + e.type + '"><div class="when">' + fmtDT(e.at) + '</div><a href="#/p/' + p.id + '"><b>' + esc(p.address) + "</b></a> — " + esc(lbl) + "</li>"; }).join("") + "</ul>";
    } else h += '<div style="margin-top:12px">' + viewMap().replace(/<h1>[^<]*<\/h1>/, "") + "</div>";
    return h;
  }

  function viewNotes() {
    var ns = S.notes.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    return "<h1>Voice Notes</h1><p class=\"sub\">Exact transcripts are kept separately from suggested summaries.</p>" + (ns.length ? '<div class="list">' + ns.map(noteCard).join("") + "</div>" : '<div class="card empty">No voice notes yet. Record one from Drive &amp; Knock.</div>');
  }

  function viewSync() {
    var pend = S.sync.filter(function (q) { return q.status === "pending"; }), fail = S.sync.filter(function (q) { return q.status === "failed"; }), sim = S.sync.filter(function (q) { return q.status === "simulated"; });
    var h = "<h1>Sync Center</h1>";
    h += '<div class="callout warn" style="margin:8px 0 12px"><b>Not connected.</b> This public demo has no Notion credentials. Runs below are simulated in your browser — no record is sent anywhere. Production sync runs server-side; CRM tokens never reach the browser.</div>';
    h += '<div class="card tight"><div class="row between"><span>Destination</span><b>Notion (simulation)</b></div><div class="row between"><span>Last simulated run</span><b class="mono">' + (S.lastSyncRun ? fmtDT(S.lastSyncRun) : "never") + '</b></div><div class="row between"><span>Last successful real sync</span><b class="mono">none — not connected</b></div><div class="row between"><span>Connection</span><b>' + (navigator.onLine ? "Online" : "Offline — queue held locally") + "</b></div></div>";
    h += '<div class="kpis" style="margin-top:10px"><div class="kpi"><b>' + pend.length + '</b><span>Pending</span></div><div class="kpi"><b>' + sim.length + '</b><span>Simulated</span></div><div class="kpi"><b style="color:' + (fail.length ? "var(--danger)" : "inherit") + '">' + fail.length + "</b><span>Failed</span></div></div>";
    h += '<div class="grid2" style="margin-top:10px"><button class="btn primary" data-act="sync-run">Run simulated sync</button><button class="btn" data-act="sync-retry"' + (fail.length ? "" : " disabled") + ">Retry failed</button></div>";
    h += '<label class="check" style="margin-top:10px"><input type="checkbox" data-act="sync-fail"' + (S.settings.simulateFailure ? " checked" : "") + "><span><b>Simulate failures</b><br><span class=\"muted\" style=\"font-size:13px\">Every other record fails so you can test error details and retry.</span></span></label>";
    h += "<h2>Queue</h2>" + (S.sync.length ? '<div class="list">' + S.sync.slice().reverse().map(function (q) {
      var badge = q.status === "pending" ? '<span class="chip warn">Pending</span>' : q.status === "failed" ? '<span class="chip bad">Failed</span>' : '<span class="chip info">Simulated · not sent</span>';
      return '<div class="card tight"><div class="row between"><b>' + esc(q.label) + "</b>" + badge + '</div><p class="sub mono" style="font-size:12px">' + esc(MAP[q.entity].db) + " · " + esc(q.op) + " · key " + esc(q.key) + " · attempts " + q.attempts + (S.mappings[q.key] ? " · ext " + esc(S.mappings[q.key]) + " (simulated)" : "") + "</p>" + (q.error ? '<p class="sub" style="color:var(--danger)">' + esc(q.error) + "</p>" : "") + "</div>";
    }).join("") + "</div>" : '<div class="card empty">Queue is empty. Confirm a disposition in the field to queue a mapped update.</div>');
    h += "<h2>Field mapping</h2>" + Object.keys(MAP).map(function (k) {
      return '<div class="card tight" style="margin-bottom:8px"><b>' + esc(MAP[k].db) + '</b><div class="table-scroll"><table class="map-table"><thead><tr><th>Nextier field</th><th>Notion property</th></tr></thead><tbody>' + MAP[k].fields.map(function (f) { return "<tr><td class=\"mono\">" + esc(f[0]) + "</td><td>" + esc(f[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    }).join("");
    h += '<div class="callout info">Audio recordings and raw source data are excluded from CRM sync unless an admin explicitly authorizes them for a destination. Inbound CRM edits do not overwrite Nextier records.</div>';
    return h;
  }

  function viewSettings() {
    var t = S.settings.theme, r = S.settings.role;
    var h = "<h1>Settings</h1>";
    h += '<h2>Appearance</h2><div class="seg" role="group" aria-label="Theme">' + [["light", "Light"], ["dark", "Dark"], ["system", "System"]].map(function (x) { return '<button data-act="theme" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div><p class=\"sub\" style=\"margin-top:6px\">Light is tuned for direct sunlight.</p>";
    h += '<h2>View as</h2><div class="seg" role="group" aria-label="Role">' + [["agent", "Agent"], ["assistant", "Assistant"], ["manager", "Manager"]].map(function (x) { return '<button data-act="role" data-v="' + x[0] + '" aria-pressed="' + (r === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div><p class=\"sub\" style=\"margin-top:6px\">Demo role switch. Production enforces access server-side.</p>";
    h += "<h2>Recording</h2><div class=\"card tight\"><p>Voice notes capture the agent's own recap after a conversation — not the conversation itself. Recording another person may require their consent depending on location.</p><p class=\"sub\">Consent notice " + (S.settings.consentAck ? "acknowledged" : "not yet acknowledged") + ".</p></div>";
    h += '<h2>Demo data</h2><button class="btn danger block" data-act="reset">Reset demo data</button>';
    return h;
  }

  // ---------- recorder ----------
  var activeRec = null;
  var audioUrls = {}; // session-only
  var SAMPLE = "I just spoke with the owner at {addr}. She's thinking about selling in the spring. Wants me to call her in February. Property needs some work. Not interested in listing right now.";
  function openRecorder(pid) {
    var p = prop(pid);
    if (p.dnc) return toast("Do Not Contact — notes disabled");
    if (!S.settings.consentAck) {
      openSheet("Before you record", '<p>Record your own recap <b>after</b> the conversation. Don\'t record the owner or anyone else without consent where the law requires it.</p><p class="sub">Audio stays on this device in the demo and is never sent to a CRM.</p><button class="btn primary block" autofocus data-act="ack">I understand</button>', function (sh) {
        $("[data-act=ack]", sh).onclick = function () { S.settings.consentAck = true; save(); openRecorder(pid); };
      });
      return;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var canRec = !!(navigator.mediaDevices && window.MediaRecorder);
    var h = '<p class="sub">Linked to <b>' + esc(p.address) + "</b></p>";
    h += '<button class="rec-orb" id="orb" aria-label="Start recording">TAP TO<br>RECORD</button><div class="rec-time" id="recTime" aria-live="off">0:00</div><p class="sub" id="recState" role="status" style="text-align:center">' + (canRec ? "Ready" : "Microphone recording not available in this browser") + (SR ? " · live speech-to-text on" : " · speech-to-text not available here") + "</p>";
    h += '<div class="grid3" style="margin:10px 0"><button class="btn small" id="pauseBtn" disabled>Pause</button><button class="btn small" id="cancelBtn">Cancel</button><button class="btn small primary" id="saveBtn" disabled>Save</button></div>';
    h += '<div class="field"><label for="noteText">Transcript <span class="muted">(exact words — edit only to fix mis-hearing)</span></label><textarea id="noteText" placeholder="Speech appears here. You can also type your note."></textarea></div>';
    h += '<button class="btn ghost small" id="sampleBtn">Use sample dictation (demo)</button>';
    openSheet("Voice note", h, function (sh) {
      var orb = $("#orb", sh), time = $("#recTime", sh), state = $("#recState", sh), ta = $("#noteText", sh);
      var mr = null, chunks = [], rec = null, t0 = 0, acc = 0, timer = null, paused = false, live = false, src = "typed", base = "";
      function tick() { var s = Math.floor((acc + (live && !paused ? Date.now() - t0 : 0)) / 1000); time.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
      function stopAll() { clearInterval(timer); try { mr && mr.state !== "inactive" && mr.stop(); } catch (e) {} try { rec && rec.stop(); } catch (e) {} if (mr && mr.stream) mr.stream.getTracks().forEach(function (t) { t.stop(); }); }
      activeRec = { cancel: function () { stopAll(); activeRec = null; } };
      function enableSave() { $("#saveBtn", sh).disabled = !ta.value.trim(); }
      ta.addEventListener("input", function () { if (!live) src = src === "speech" ? "speech (edited)" : "typed"; enableSave(); });
      orb.onclick = function () {
        if (live) { // stop
          stopAll(); live = false; orb.classList.remove("live", "paused"); orb.innerHTML = "RECORD<br>AGAIN"; state.textContent = "Stopped — review the transcript, then save"; $("#pauseBtn", sh).disabled = true; enableSave(); return;
        }
        if (!canRec && !SR) { state.textContent = "Recording unavailable — type your note or use the sample"; ta.focus(); return; }
        live = true; paused = false; t0 = Date.now(); acc = 0; chunks = []; base = ta.value ? ta.value + " " : "";
        orb.classList.add("live"); orb.innerHTML = "TAP TO<br>STOP"; orb.setAttribute("aria-label", "Stop recording"); state.textContent = "● Recording"; $("#pauseBtn", sh).disabled = false;
        timer = setInterval(tick, 250);
        if (canRec) {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            mr = new MediaRecorder(stream); mr.stream = stream;
            mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
            mr.onstop = function () { if (chunks.length) sh._audio = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || "audio/webm" })); };
            mr.start();
          }).catch(function () { state.textContent = "Mic permission denied — speech-to-text " + (SR ? "may still work" : "unavailable") + "; you can type instead"; });
        }
        if (SR) {
          rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
          rec.onresult = function (e) { var s = ""; for (var i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; ta.value = base + s.trim(); src = "speech"; enableSave(); };
          rec.onerror = function (e) { state.textContent = "Speech-to-text error (" + e.error + ") — type or retry"; };
          try { rec.start(); } catch (e) {}
        }
      };
      $("#pauseBtn", sh).onclick = function () {
        if (!live) return;
        if (!paused) { paused = true; acc += Date.now() - t0; try { mr && mr.pause(); } catch (e) {} try { rec && rec.stop(); } catch (e) {} orb.classList.add("paused"); state.textContent = "Paused"; this.textContent = "Resume"; }
        else { paused = false; t0 = Date.now(); base = ta.value ? ta.value + " " : ""; try { mr && mr.resume(); } catch (e) {} try { rec && rec.start(); } catch (e) {} orb.classList.remove("paused"); state.textContent = "● Recording"; this.textContent = "Pause"; }
      };
      $("#cancelBtn", sh).onclick = function () { closeSheet(); toast("Recording discarded"); };
      $("#sampleBtn", sh).onclick = function () { ta.value = SAMPLE.replace("{addr}", p.address); src = "sample dictation"; enableSave(); };
      $("#saveBtn", sh).onclick = function () {
        var text = ta.value.trim(); if (!text) return;
        stopAll(); activeRec = null;
        var note = { id: uid("n"), propId: pid, at: now(), agent: AGENT, transcript: text, transcriptSource: src, audio: !!sh._audio, confirmed: false };
        if (sh._audio) audioUrls[note.id] = sh._audio;
        S.notes.push(note);
        addEvent(pid, "note", { noteId: note.id });
        save();
        openReview(note.id);
      };
    });
  }

  function openReview(nid) {
    var n = S.notes.find(function (x) { return x.id === nid; }), p = prop(n.propId), x = extract(n.transcript);
    function item(k, o) { return '<div class="xitem' + (o ? "" : " none") + '"><div class="k">' + k + '</div><div class="v">' + (o ? esc(o.v.length === 10 && /^\d{4}-/.test(o.v) ? fmtDate(o.v) : o.v) : "Not mentioned") + "</div>" + (o && o.ev ? '<div class="ev">From: “' + esc(o.ev) + "”</div>" : "") + "</div>"; }
    var summary = [x.who ? "Spoke with " + x.who.v.split(" (")[0].toLowerCase() + "." : null, x.disposition ? x.disposition.v + "." : null, x.timing ? "Timing: " + x.timing.v + "." : null, x.condition ? "Condition: " + x.condition.v + "." : null].filter(Boolean).join(" ");
    var h = '<p class="sub">' + esc(p.address) + " · " + fmtDT(n.at) + " · " + esc(n.agent) + "</p>";
    h += '<p class="eyebrow" style="margin-top:8px">Exact transcript · ' + esc(n.transcriptSource) + '</p><div class="transcript">' + esc(n.transcript) + "</div>";
    if (audioUrls[n.id]) h += '<audio controls src="' + audioUrls[n.id] + '" style="width:100%;margin-top:8px"></audio>';
    h += '<p class="eyebrow" style="margin-top:14px">Suggested extraction <span class="src ai">rule-based demo · not committed</span></p><div class="xgrid">' + item("Who", x.who) + item("Disposition", x.disposition) + item("Timing", x.timing) + item("Follow-up date", x.followUp) + item("Property condition", x.condition) + item("Next best action", x.nextAction ? { v: x.nextAction } : null) + "</div>";
    if (x.review.length) h += '<div class="callout warn" style="margin-top:10px"><b>Needs your review</b><ul style="margin:6px 0 0 18px;padding:0">' + x.review.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></div>";
    h += '<h2>Confirm</h2><div class="field"><label for="rvOutcome">Visit outcome</label><select id="rvOutcome">' + Object.keys(VISIT_OUTCOMES).map(function (k) { var def = x.who ? (x.who.v.indexOf("Owner") === 0 ? "spoke_owner" : x.who.v.indexOf("Tenant") === 0 ? "spoke_tenant" : "spoke_other") : ((latest(p.id, "visit") || {}).data || {}).outcome || "spoke_owner"; return '<option value="' + k + '"' + (k === def ? " selected" : "") + ">" + esc(VISIT_OUTCOMES[k]) + "</option>"; }).join("") + "</select></div>";
    h += '<div class="field"><label for="rvDisp">Owner disposition</label><select id="rvDisp"><option value="">— Choose —</option>' + DISPOSITIONS.map(function (d) { return "<option" + (x.disposition && x.disposition.v === d ? " selected" : "") + ">" + esc(d) + "</option>"; }).join("") + '</select><span class="hint">Pre-selected from the note where stated. You decide.</span></div>';
    h += '<div class="field"><label for="rvSummary">Conversation summary</label><textarea id="rvSummary" style="min-height:70px">' + esc(summary) + "</textarea></div>";
    h += '<div class="field"><label for="rvNext">Next action</label><input id="rvNext" type="text" value="' + esc(x.nextAction || "") + '"></div>';
    h += '<div class="field"><label for="rvDate">Follow-up date</label><input id="rvDate" type="date" value="' + esc(x.followUp ? x.followUp.v : "") + '"><span class="hint">Leave empty for no follow-up task.</span></div>';
    h += '<label class="check"><input type="checkbox" id="rvTask"' + (x.followUp ? " checked" : "") + '><span>Create linked follow-up task</span></label>';
    h += '<button class="btn primary block" style="margin-top:14px" id="rvConfirm">Confirm &amp; commit</button><button class="btn ghost block" style="margin-top:6px" id="rvLater">Save note, review later</button>';
    openSheet("Review voice note", h, function (sh) {
      $("#rvLater", sh).onclick = function () { closeSheet(); render(); toast("Note saved — nothing committed yet"); };
      $("#rvConfirm", sh).onclick = function () {
        var disp = $("#rvDisp", sh).value, date = $("#rvDate", sh).value, mk = $("#rvTask", sh).checked, outcome = $("#rvOutcome", sh).value;
        if (!disp) { toast("Choose a disposition to commit"); $("#rvDisp", sh).focus(); return; }
        if (mk && !date && disp !== "Do Not Contact") { toast("Pick a follow-up date or untick the task"); $("#rvDate", sh).focus(); return; }
        n.confirmed = true; n.confirmedBy = AGENT; n.summary = $("#rvSummary", sh).value.trim(); n.disposition = disp;
        var editedFromSuggestion = !x.disposition || x.disposition.v !== disp;
        commitOutcome(p, outcome, disp, $("#rvNext", sh).value.trim(), mk ? date : null, editedFromSuggestion ? "agent" : "ai-confirmed", n.summary, n.id);
        closeSheet(); render();
        toast("Committed · status, pipeline and sync queue updated");
      };
    });
  }

  // One place where a confirmed field result becomes events, tasks and queued sync.
  function commitOutcome(p, outcome, disp, nextAction, followDate, source, summary, noteId) {
    var lastVisit = latest(p.id, "visit");
    if (!lastVisit || !isToday(lastVisit.at) || lastVisit.data.outcome !== outcome) addEvent(p.id, "visit", { outcome: outcome });
    if (/^spoke/.test(outcome)) bumpStage(p, 2); else bumpStage(p, 1);
    var d = addEvent(p.id, "disposition", { disposition: disp, nextAction: nextAction, noteId: noteId || null }, source);
    if (disp === "Do Not Contact") {
      p.dnc = true;
      S.tasks.forEach(function (t) { if (t.propId === p.id && t.status === "open") { t.status = "cancelled"; enqueue("task", t.id, "Task cancelled · " + p.address); } });
      addEvent(p.id, "suppressed", {}, "system");
    } else if (disp === "Not Interested" || disp === "Keep Property" || disp === "Already Sold" || disp === "Already Listed") {
      // no follow-up created; respect the decision
    } else if (disp === "Wrong Owner / Ownership Unconfirmed") {
      createTask(p, "Verify ownership — owner not confirmed at door", addDays(2), "normal", d.id, "verify", ASSISTANT);
    } else if (/^Interested in/.test(disp)) {
      bumpStage(p, 3);
      addEvent(p.id, "stage", { to: 3 }, source);
      if (!followDate) createTask(p, "Review interest & book consultation", addDays(1), "high", d.id);
    }
    if (followDate && disp !== "Do Not Contact") createTask(p, nextAction || "Follow up", followDate, "normal", d.id);
    enqueue("property", p.id, "Property · " + p.address);
    enqueue("activity", d.id, "Visit activity · " + p.address + " · " + disp);
    save();
  }
  function createTask(p, title, due, priority, originId, kind, assignee) {
    var t = { id: uid("t"), propId: p.id, title: title, due: due, priority: priority || "normal", status: "open", assignee: assignee || AGENT, originEventId: originId || null, needsReview: false, kind: kind || "followup", createdAt: now() };
    S.tasks.push(t);
    addEvent(p.id, "task", { title: title, taskId: t.id }, "system");
    enqueue("task", t.id, "Task · " + title);
    return t;
  }

  // ---------- field actions ----------
  function fieldAction(a, pid) {
    var p = prop(pid);
    if (p.dnc && a !== "next") return toast("Do Not Contact — action blocked");
    if (a === "arrived") { addEvent(pid, "arrived", {}); save(); render(); toast("Arrival logged (not a visit)"); return; }
    if (a === "no_answer") {
      addEvent(pid, "knock", {}); addEvent(pid, "visit", { outcome: "no_answer" }); bumpStage(p, 1); enqueue("property", pid, "Property · " + p.address); save(); render();
      openSheet("No answer at " + p.address, '<p>Attempt recorded. Suggest a revisit?</p><div class="grid2"><button class="btn primary" id="rv1" autofocus>Revisit in 3 days</button><button class="btn" id="rv0">No revisit</button></div>', function (sh) {
        $("#rv1", sh).onclick = function () { createTask(p, "Revisit — no answer", addDays(3), "low", null); save(); closeSheet(); render(); toast("Revisit task created"); };
        $("#rv0", sh).onclick = function () { closeSheet(); };
      });
      return;
    }
    if (a === "spoke_owner" || a === "spoke_other") {
      if (a === "spoke_other") {
        openSheet("Who did you speak with?", '<div class="menu-list"><button class="btn" data-o="spoke_tenant" autofocus>Tenant / occupant</button><button class="btn" data-o="spoke_other">Other person (family, neighbor…)</button></div>', function (sh) {
          $$("[data-o]", sh).forEach(function (b) { b.onclick = function () { addEvent(pid, "knock", {}); addEvent(pid, "visit", { outcome: b.getAttribute("data-o") }); bumpStage(p, 2); save(); closeSheet(); render(); openRecorder(pid); }; });
        });
        return;
      }
      addEvent(pid, "knock", {}); addEvent(pid, "visit", { outcome: "spoke_owner" }); bumpStage(p, 2); save(); render();
      toast("Conversation logged — record your recap");
      openRecorder(pid);
      return;
    }
    if (a === "followup") {
      openSheet("Schedule follow-up", '<p class="sub">' + esc(p.address) + '</p><div class="field"><label for="fuT">What</label><input id="fuT" type="text" value="Follow-up call" autofocus></div><div class="field"><label for="fuD">Due date (required)</label><input id="fuD" type="date" value="' + addDays(7) + '"></div><div class="field"><label for="fuP">Priority</label><select id="fuP"><option>normal</option><option>high</option><option>low</option></select></div><button class="btn primary block" id="fuS">Create task</button>', function (sh) {
        $("#fuS", sh).onclick = function () { var d = $("#fuD", sh).value; if (!d) { toast("Due date required"); return; } createTask(p, $("#fuT", sh).value || "Follow-up", d, $("#fuP", sh).value, null); save(); closeSheet(); render(); toast("Follow-up created & queued for CRM"); };
      });
      return;
    }
    if (a === "appt") {
      openSheet("Book appointment", '<p class="sub">' + esc(p.address) + '</p><div class="field"><label for="apK">Type</label><select id="apK" autofocus><option>Listing consultation</option><option>Property walkthrough</option><option>Discovery call</option></select></div><div class="grid2"><div class="field"><label for="apD">Date</label><input id="apD" type="date"></div><div class="field"><label for="apT">Time</label><input id="apT" type="time"></div></div><label class="check"><input type="checkbox" id="apC"><span>The owner agreed to this date and time</span></label><button class="btn primary block" style="margin-top:12px" id="apS">Confirm booking</button><p class="sub" style="margin-top:8px">Nothing is sent to the owner from this demo.</p>', function (sh) {
        $("#apS", sh).onclick = function () {
          var d = $("#apD", sh).value, t = $("#apT", sh).value;
          if (!d || !t) { toast("Date and time are required"); return; }
          if (!$("#apC", sh).checked) { toast("Confirm the owner agreed before booking"); return; }
          var ap = { id: uid("a"), propId: pid, kind: $("#apK", sh).value, date: d, time: t, status: "booked", by: AGENT, createdAt: now() };
          S.appts.push(ap); bumpStage(p, 4);
          addEvent(pid, "appointment", { when: fmtDate(d) + " " + t, apptId: ap.id }); addEvent(pid, "stage", { to: 4 });
          enqueue("appointment", ap.id, "Appointment · " + p.address); enqueue("property", pid, "Property · " + p.address);
          save(); closeSheet(); render(); toast("Appointment booked");
        };
      });
      return;
    }
    if (a === "more") {
      var opts = ["nobody_home", "vacant", "access_restricted", "rescheduled"];
      openSheet("More outcomes", '<div class="menu-list">' + opts.map(function (o, i) { return '<button class="btn" data-o="' + o + '"' + (i === 0 ? " autofocus" : "") + ">" + esc(VISIT_OUTCOMES[o]) + "</button>"; }).join("") + '<button class="btn danger" data-o="dnc">Resident asked not to be contacted</button></div>', function (sh) {
        $$("[data-o]", sh).forEach(function (b) {
          b.onclick = function () {
            var o = b.getAttribute("data-o");
            if (o === "dnc") { commitOutcome(p, "spoke_other", "Do Not Contact", "Suppress all outreach", null, "agent"); closeSheet(); render(); toast("Do Not Contact recorded — outreach suppressed"); return; }
            if (o !== "access_restricted") addEvent(pid, "knock", {});
            addEvent(pid, "visit", { outcome: o }); bumpStage(p, 1); enqueue("property", pid, "Property · " + p.address); save(); closeSheet(); render(); toast(VISIT_OUTCOMES[o] + " recorded");
          };
        });
      });
      return;
    }
    if (a === "next") {
      var q = fieldQueue().filter(function (x) { return !x.dnc && x.id !== pid && (status(x) === "Not Visited" || status(x) === "Scheduled for Visit"); });
      S.session.currentId = q.length ? q[0].id : null; save(); render();
      toast(q.length ? "Next: " + q[0].address : "List complete");
      window.scrollTo(0, 0);
    }
  }

  // ---------- CSV import ----------
  function parseCsv(text) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i], n = text[i + 1];
      if (c === '"' && q && n === '"') { f += '"'; i++; } else if (c === '"') q = !q;
      else if (c === "," && !q) { row.push(f); f = ""; }
      else if ((c === "\n" || c === "\r") && !q) { if (c === "\r" && n === "\n") i++; row.push(f); if (row.some(Boolean)) rows.push(row); row = []; f = ""; }
      else f += c;
    }
    row.push(f); if (row.some(Boolean)) rows.push(row);
    return rows;
  }
  function importCsv(text) {
    var rows = parseCsv(text); if (rows.length < 2) return toast("CSV has no data rows");
    var hdr = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    function col() { for (var i = 0; i < arguments.length; i++) { var k = hdr.indexOf(arguments[i]); if (k >= 0) return k; } return -1; }
    var ia = col("address", "property address", "street address", "company(address)"), io = col("owner", "owner name", "first name"), iz = col("zip", "zip code"), ip = col("parcel", "parcel id", "apn");
    if (ia < 0) return toast("CSV needs an 'Address' column");
    var listId = uid("L"); S.lists.push({ id: listId, name: "Imported " + new Date().toLocaleDateString(), source: "CSV import" });
    var added = 0, dup = 0, seen = {};
    S.props.forEach(function (p) { seen[p.address.toLowerCase().replace(/\W/g, "")] = 1; });
    rows.slice(1).forEach(function (r, i) {
      var a = (r[ia] || "").trim(); if (!a) return;
      var k = a.toLowerCase().replace(/\W/g, ""); if (seen[k]) { dup++; return; } seen[k] = 1;
      S.props.push({ id: uid("p"), address: a, city: "", zip: iz >= 0 ? r[iz] : "", nbhd: "Imported", parcel: ip >= 0 ? r[ip] : "—", type: "Unknown", owner: { name: io >= 0 ? r[io] || "Unknown" : "Unknown", verified: false, verifySource: null }, contact: { phone: null, source: null }, signals: [{ label: "Imported list", date: dayKey() }], list: listId, pipeline: "field", agent: AGENT, seq: 200 + i, stage: 0, dnc: false, noSolicit: false, archived: false, scheduled: false, x: 0, y: 0 });
      added++;
    });
    save(); render(); toast(added + " imported · " + dup + " duplicates skipped · owners marked unverified");
  }

  // ---------- router & render ----------
  var ROUTES = { today: viewToday, book: viewBook, map: viewMap, field: viewField, tasks: viewTasks, pipeline: viewPipeline, notes: viewNotes, sync: viewSync, settings: viewSettings };
  function route() { var h = location.hash.replace(/^#\/?/, "") || "today"; var parts = h.split("/"); return { name: parts[0], arg: parts[1] }; }
  var lastRoute = "";
  function render() {
    var r = route(), main = $("#main"), html;
    if (r.name === "p" && r.arg) html = viewProp(r.arg); else html = (ROUTES[r.name] || viewToday)();
    main.innerHTML = html;
    var tab = r.name === "p" ? "book" : r.name === "map" ? "field" : r.name;
    $$(".tabbar a").forEach(function (a) { if (a.getAttribute("data-tab") === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var pend = S.sync.filter(function (q) { return q.status !== "simulated"; }).length;
    var sb = $("#syncBadge"); sb.hidden = !pend; sb.textContent = pend;
    var due = openTasks().filter(function (t) { return t.due && t.due <= dayKey(); }).length;
    var tb = $("#taskBadge"); tb.hidden = !due; tb.textContent = due;
    var net = $("#netState"); net.textContent = navigator.onLine ? "Online" : "Offline · not uploaded"; net.title = navigator.onLine ? "Online — changes saved on this device" : "Offline — changes saved on this device, not uploaded"; net.classList.toggle("off", !navigator.onLine);
    var key = location.hash;
    if (key !== lastRoute) { lastRoute = key; window.scrollTo(0, 0); }
    bindView();
  }
  function bindView() {
    var q = $("#bookQ"); if (q) q.addEventListener("input", function () { bookState.q = q.value; var pos = q.selectionStart; render(); var nq = $("#bookQ"); nq.focus(); nq.setSelectionRange(pos, pos); });
    var bs = $("#bookStatus"); if (bs) bs.addEventListener("change", function () { bookState.status = bs.value; render(); });
    var ls = $("#listSel"); if (ls) ls.addEventListener("change", function () { S.session.listId = ls.value; S.session.currentId = null; save(); render(); });
    var csv = $("#csvIn"); if (csv) csv.addEventListener("change", function () { var f = csv.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { importCsv(String(r.result)); }; r.readAsText(f); });
    var lbl = $('label[for="csvIn"]'); if (lbl) lbl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#csvIn").click(); } });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    var a = b.getAttribute("data-act"), id = b.getAttribute("data-id"), v = b.getAttribute("data-v");
    if (a.indexOf("f-") === 0) return fieldAction(a.slice(2), id);
    switch (a) {
      case "record": openRecorder(id); break;
      case "review-note": openReview(id); break;
      case "work-here": S.session.listId = prop(id).list; S.session.currentId = id; save(); location.hash = "#/field"; break;
      case "task-done": var t = S.tasks.find(function (x) { return x.id === id; }); t.status = "done"; t.doneAt = now(); enqueue("task", t.id, "Task done · " + t.title); save(); render(); toast("Task completed"); break;
      case "appt-done": var ap = S.appts.find(function (x) { return x.id === id; }); ap.status = "completed"; ap.doneAt = now(); var pp = prop(ap.propId); bumpStage(pp, 5); addEvent(pp.id, "stage", { to: 5 }); enqueue("appointment", ap.id, "Appointment completed · " + pp.address); enqueue("property", pp.id, "Property · " + pp.address); save(); render(); toast("Appointment marked completed"); break;
      case "verify-task": var vp = prop(id); createTask(vp, "Verify ownership — confirm current owner of record", addDays(2), "normal", null, "verify", ASSISTANT); save(); render(); toast("Verification task assigned to assistant"); break;
      case "advance": openAdvance(id); break;
      case "pipe": S.settings.pipeline = v; save(); render(); break;
      case "pview": pipeView = v; render(); break;
      case "tview": taskView = v; render(); break;
      case "theme": setTheme(v); render(); break;
      case "role": S.settings.role = v; save(); render(); break;
      case "sync-run": runSync(false); break;
      case "sync-retry": runSync(true); break;
      case "add-prop": openAddProp(); break;
      case "reset": if (confirm("Reset all demo data on this device?")) { localStorage.removeItem(KEY); load(); location.hash = "#/today"; render(); toast("Demo data reset"); } break;
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches("[data-act=sync-fail]")) { S.settings.simulateFailure = e.target.checked; save(); }
  });

  function openAdvance(id) {
    var p = prop(id), to = p.stage + 1;
    var need = { 4: "A booked consultation with date and time", 5: "The appointment actually took place", 6: "A verified, qualified opportunity", 7: "A signed listing or purchase agreement", 8: "A closed transaction" }[to] || "Agent confirmation";
    openSheet("Advance stage", "<p>Move <b>" + esc(p.address) + "</b> from <b>" + esc(STAGES[p.stage]) + "</b> to <b>" + esc(STAGES[to]) + '</b>?</p><div class="callout info">Required evidence: ' + esc(need) + '</div><label class="check" style="margin-top:10px"><input type="checkbox" id="advC"><span>I confirm this evidence exists</span></label><button class="btn primary block" style="margin-top:12px" id="advS">Advance</button>', function (sh) {
      $("#advS", sh).onclick = function () { if (!$("#advC", sh).checked) { toast("Confirm the evidence first"); return; } p.stage = to; addEvent(p.id, "stage", { to: to }); enqueue("property", p.id, "Property · " + p.address); save(); closeSheet(); render(); toast("Stage → " + STAGES[to]); };
    });
  }
  function openAddProp() {
    openSheet("Add property", '<div class="field"><label for="apA">Address</label><input id="apA" type="text" autofocus></div><div class="field"><label for="apO">Owner name (optional)</label><input id="apO" type="text"></div><div class="field"><label for="apTy">Type</label><select id="apTy"><option>Single-family</option><option>Two-family</option><option>Condo</option><option>Multi-family</option><option>Land</option></select></div><p class="sub">Owner will be marked unverified.</p><button class="btn primary block" id="apSave">Add to field list</button>', function (sh) {
      $("#apSave", sh).onclick = function () {
        var a = $("#apA", sh).value.trim(); if (!a) { toast("Address required"); return; }
        var k = a.toLowerCase().replace(/\W/g, ""); var dupe = S.props.find(function (p) { return p.address.toLowerCase().replace(/\W/g, "") === k; });
        if (dupe) { closeSheet(); location.hash = "#/p/" + dupe.id; toast("Already in the book — opened existing record"); return; }
        var p = { id: uid("p"), address: a, city: "", zip: "", nbhd: "Added in field", parcel: "—", type: $("#apTy", sh).value, owner: { name: $("#apO", sh).value.trim() || "Unknown", verified: false, verifySource: null }, contact: { phone: null, source: null }, signals: [{ label: "Spotted in field", date: dayKey() }], list: S.session.listId, pipeline: "field", agent: AGENT, seq: 300 + S.props.length, stage: 0, dnc: false, noSolicit: false, archived: false, scheduled: false, x: 0, y: 0 };
        S.props.push(p); enqueue("property", p.id, "Property · " + p.address); save(); closeSheet(); location.hash = "#/p/" + p.id; toast("Property added");
      };
    });
  }

  function setTheme(v) {
    S.settings.theme = v; save();
    document.documentElement.setAttribute("data-theme-pref", v);
    if (v === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", v);
  }

  $("#syncBtn").addEventListener("click", function () { location.hash = "#/sync"; });
  $("#moreBtn").addEventListener("click", function () {
    var links = [["#/map", "Field Map"], ["#/notes", "Voice Notes"], ["#/sync", "Sync Center"], ["#/book", "Property Book"], ["#/settings", "Settings · theme · role"]];
    var t = S.settings.theme;
    openSheet("Menu", '<div class="menu-list">' + links.map(function (l, i) { return '<a class="btn" href="' + l[0] + '"' + (i === 0 ? " autofocus" : "") + ">" + l[1] + "</a>"; }).join("") + '</div><h2>Theme</h2><div class="seg" role="group" aria-label="Theme">' + [["light", "Light"], ["dark", "Dark"], ["system", "System"]].map(function (x) { return '<button data-act="theme" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>", function (sh) {
      $$("a", sh).forEach(function (a) { a.addEventListener("click", function () { setTimeout(closeSheet, 0); }); });
      $$("[data-act=theme]", sh).forEach(function (b) { b.addEventListener("click", function () { $$("[data-act=theme]", sh).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); }); });
    });
  });

  window.addEventListener("hashchange", function () { if ($("#sheetRoot").innerHTML) $("#sheetRoot").innerHTML = ""; render(); $("#main").focus({ preventScroll: true }); });
  window.addEventListener("online", function () { render(); toast("Back online — queue still needs a sync run"); });
  window.addEventListener("offline", function () { render(); toast("Offline — changes stay on this device"); });
  window.addEventListener("storage", function (e) { if (e.key === KEY) { load(); render(); } });

  load();
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});

  // test hook (no side effects unless called)
  window.__vos = { state: function () { return S; }, extract: extract };
})();
