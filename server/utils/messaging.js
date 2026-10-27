const path = require('path');
const cluster = require('node:cluster');

// Indian 10-digit mobile → E.164
const toE164 = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

// SMS goes out from the admin's own SIM through the free "SMS Gate" Android app (sms-gate.app).
const sendSMS = async (phone, text) => {
  const { SMS_GATEWAY_USER: user, SMS_GATEWAY_PASS: pass } = process.env;
  const url = process.env.SMS_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1/messages';
  if (!user || !pass) throw new Error('SMS gateway is not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ textMessage: { text }, phoneNumbers: [toE164(phone)] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`SMS gateway: ${(await res.text().catch(() => '')) || res.status}`);
};

// WhatsApp goes out from the admin's own WhatsApp account, linked once by scanning a QR code
// (same as WhatsApp Web). Unofficial: WhatsApp may ban numbers that send in bulk.
let waClient = null;
let waReady = false;

const startWhatsApp = () => {
  if (process.env.WHATSAPP_ENABLED !== 'true') return;
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '..', '.wwebjs_auth') }),
    puppeteer: { headless: true, args: ['--no-sandbox'], executablePath: process.env.WHATSAPP_CHROME_PATH || undefined },
  });
  waClient.on('qr', (qr) => {
    console.log('WhatsApp: scan this QR with WhatsApp → Settings → Linked devices → Link a device');
    qrcode.generate(qr, { small: true });
  });
  waClient.on('ready', () => { waReady = true; console.log('WhatsApp connected'); });
  waClient.on('disconnected', (reason) => { waReady = false; console.log('WhatsApp disconnected:', reason); });
  waClient.initialize().catch((err) => console.error('WhatsApp failed to start:', err.message));
};

// Under cluster.js the client runs in the primary; workers ask it over IPC
let nextId = 0;
const pending = new Map();
if (cluster.isWorker) {
  process.on('message', (msg) => {
    if (msg?.type !== 'wa:result' || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error));
    else resolve();
  });
}
const sendViaPrimary = (phone, text) => new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => pending.delete(id) && reject(new Error('WhatsApp send timed out')), 30_000);
  pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
  process.send({ type: 'wa:send', id, phone, text });
});

const sendWhatsApp = async (phone, text) => {
  if (cluster.isWorker) return sendViaPrimary(phone, text);
  if (!waReady) throw new Error('WhatsApp is not connected (enable it and scan the QR in the server terminal)');
  const chat = await waClient.getNumberId(toE164(phone).slice(1));
  if (!chat) throw new Error('this number is not on WhatsApp');
  await waClient.sendMessage(chat._serialized, text);
};

// Primary side of the IPC above
const serveWhatsAppToWorkers = () => {
  startWhatsApp();
  cluster.on('message', async (worker, msg) => {
    if (msg?.type !== 'wa:send') return;
    try {
      await sendWhatsApp(msg.phone, msg.text);
      worker.send({ type: 'wa:result', id: msg.id });
    } catch (err) {
      worker.send({ type: 'wa:result', id: msg.id, error: err.message });
    }
  });
};

module.exports = { toE164, sendSMS, sendWhatsApp, startWhatsApp, serveWhatsAppToWorkers };
