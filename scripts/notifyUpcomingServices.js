#!/usr/bin/env node
/*
  notifyUpcomingServices.js

  Query the backend for machines with nextServiceDue in N days (default 5),
  sort them, and send an email with details to techsupport@accordmedical.co.ke.

  Configuration via environment variables (see .env.example):
    API_BASE_URL - base API URL (e.g. https://app.codewithseth.co.ke/api)
    API_TOKEN - bearer token to call the API (optional; if omitted will call unauthenticated endpoints)
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS - SMTP credentials for sending email
    EMAIL_FROM - From address (default: no-reply@accordmedical.co.ke)
    EMAIL_TO - Recipient (default: techsupport@accordmedical.co.ke)
    DAYS_AHEAD - days ahead to look for (default: 5)

  Usage (local):
    node scripts/notifyUpcomingServices.js

  Cron example (run daily at 08:00):
    0 8 * * * cd /path/to/ADMINACCORD && /usr/bin/node scripts/notifyUpcomingServices.js >> logs/notify.log 2>&1

*/

// Load .env if present
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }
const nodemailer = require('nodemailer');
const { URL } = require('url');

const API_BASE_URL = process.env.API_BASE_URL || 'https://app.codewithseth.co.ke/api';
const API_TOKEN = process.env.API_TOKEN || '';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@accordmedical.co.ke';
const EMAIL_TO = process.env.EMAIL_TO || 'techsupport@accordmedical.co.ke';
const DAYS_AHEAD = process.env.DAYS_AHEAD ? parseInt(process.env.DAYS_AHEAD, 10) : 5;

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch (e) {
    return String(d);
  }
}

async function fetchMachinesDueIn(daysAhead) {
  // We will request machines and filter client-side since backend query params may vary.
  // Try to request a large page size to reduce calls.
  const url = new URL('/api/machines', API_BASE_URL);
  url.searchParams.set('limit', '1000');

  const headers = {
    'Content-Type': 'application/json',
  };
  if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch machines: ${res.status} ${res.statusText}`);
  }
  const payload = await res.json();
  // payload expected shape: { success: true, data: { docs: [ ... ] } } or { success: true, data: [ ... ] }
  let machines = [];
  if (payload && payload.data) {
    if (Array.isArray(payload.data)) machines = payload.data;
    else if (Array.isArray(payload.data.docs)) machines = payload.data.docs;
    else if (Array.isArray(payload.data.items)) machines = payload.data.items;
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);

  // Filter machines with a nextServiceDue within the targetDate (same day)
  const matches = machines.filter((m) => {
    if (!m.nextServiceDue) return false;
    const nsd = new Date(m.nextServiceDue);
    // compare only date part
    return nsd.getFullYear() === targetDate.getFullYear() &&
      nsd.getMonth() === targetDate.getMonth() &&
      nsd.getDate() === targetDate.getDate();
  });

  // Sort by facility.name then model then serialNumber
  matches.sort((a, b) => {
    const fa = (a.facility && a.facility.name) || '';
    const fb = (b.facility && b.facility.name) || '';
    if (fa !== fb) return fa.localeCompare(fb);
    const ma = a.model || '';
    const mb = b.model || '';
    if (ma !== mb) return ma.localeCompare(mb);
    return (a.serialNumber || '').localeCompare(b.serialNumber || '');
  });

  return matches;
}

function buildHtmlEmail(machines, daysAhead) {
  if (!machines || machines.length === 0) return `<p>No machines due for service in ${daysAhead} days.</p>`;
  let html = `<p>The following machines are due for service in ${daysAhead} days (${formatDate(new Date(Date.now() + daysAhead * 24*3600*1000))}):</p>`;
  html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">';
  html += '<thead><tr><th>Facility</th><th>Model</th><th>Serial</th><th>Manufacturer</th><th>Installed</th><th>LastServicedAt</th><th>NextServiceDue</th><th>Contact</th><th>Status</th></tr></thead><tbody>';
  machines.forEach((m) => {
    const facility = (m.facility && (m.facility.name || m.facility.location)) || '';
    const contact = (m.contactPerson && `${m.contactPerson.name || ''} ${m.contactPerson.phone || ''} ${m.contactPerson.email || ''}`) || '';
    html += `<tr>`;
    html += `<td>${escapeHtml(facility)}</td>`;
    html += `<td>${escapeHtml(m.model || '')}</td>`;
    html += `<td>${escapeHtml(m.serialNumber || '')}</td>`;
    html += `<td>${escapeHtml(m.manufacturer || '')}</td>`;
    html += `<td>${escapeHtml(formatDate(m.installedDate) || '')}</td>`;
    html += `<td>${escapeHtml(formatDate(m.lastServicedAt) || '')}</td>`;
    html += `<td>${escapeHtml(formatDate(m.nextServiceDue) || '')}</td>`;
    html += `<td>${escapeHtml(contact)}</td>`;
    html += `<td>${escapeHtml(m.status || '')}</td>`;
    html += `</tr>`;
  });
  html += '</tbody></table>';
  html += `<p>Total: ${machines.length}</p>`;
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmail(subject, html) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject,
    html,
  });
  return info;
}

async function main() {
  try {
    console.log(`Using API base: ${API_BASE_URL}`);
    console.log(`Looking for machines due in ${DAYS_AHEAD} days...`);
    const machines = await fetchMachinesDueIn(DAYS_AHEAD);
    console.log(`Found ${machines.length} machines due in ${DAYS_AHEAD} days.`);

    if (!machines || machines.length === 0) {
      const html = buildHtmlEmail([], DAYS_AHEAD);
      // Optionally still send a summary email — but by default we will not send empty reports.
      console.log('No machines due; exiting without sending an email.');
      return 0;
    }

    const html = buildHtmlEmail(machines, DAYS_AHEAD);
    const subject = `[Accord] Machines due for service in ${DAYS_AHEAD} days - ${machines.length} items`;

    const info = await sendEmail(subject, html);
    console.log('Email sent:', info && info.messageId);
    return 0;
  } catch (err) {
    console.error('Error in notifyUpcomingServices:', err && err.message ? err.message : err);
    return 2;
  }
}

if (require.main === module) {
  // node >=18 has global fetch. If not, instruct user to install node-fetch and set global.fetch.
  if (typeof fetch !== 'function') {
    console.error('Global fetch is not available in this Node runtime. Use Node 18+ or install and polyfill node-fetch.');
    process.exit(3);
  }
  main().then((code) => process.exit(code));
}

module.exports = { fetchMachinesDueIn, buildHtmlEmail, sendEmail };
