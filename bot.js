const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHANNEL_ID;
const USER_DATA_DIR = path.resolve(__dirname, 'user-data');

let lastTextId = '';
let lastImageSrc = '';

async function sendTextToTelegram(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
    });
    console.log('📬 Sent text to Telegram.');
  } catch (err) {
    console.error('❌ Telegram text error:', err.message);
  }
}

async function sendImageToTelegram(imageUrl) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      photo: imageUrl,
    });
    console.log('📷 Sent image to Telegram.');
  } catch (err) {
    console.error('❌ Telegram image error:', err.message);
  }
}

async function runBot() {
  const browser = await puppeteer.launch({
    headless: 'new', // Use headless Chrome, required in cloud
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,720'
    ],
    userDataDir: USER_DATA_DIR,
    defaultViewport: null
  });

  const [page] = await browser.pages();
  await page.goto('https://rpy.club/chat', { waitUntil: 'domcontentloaded' });

  // Check if login is required
  const isLogin = await page.evaluate(() => {
    const inputExists = !!document.querySelector('input[name="username"]');
    const loginButtonExists = Array.from(document.querySelectorAll('button')).some(
      btn => btn.innerText.trim().toLowerCase().includes('login')
    );
    return inputExists || loginButtonExists;
  });

  if (isLogin) {
    console.log('🔓 Login required. Please log in manually using headful mode locally.');
  } else {
    console.log('✅ Already logged in.');
  }

  // Infinite message check loop
  while (true) {
    try {
      const result = await page.evaluate(() => {
        const lastTextEl = Array.from(document.querySelectorAll('#unique_message_linBreak')).at(-1);
        const lastImageEl = Array.from(document.querySelectorAll('.str-chat__message-attachment--image img')).at(-1);

        const text = lastTextEl?.innerText?.trim() || null;
        const textId = lastTextEl?.getAttribute('data-message-id') || text?.slice(0, 50) || null;
        const imageSrc = lastImageEl?.src || null;

        return { text, textId, imageSrc };
      });

      if (result.text && result.textId !== lastTextId) {
        lastTextId = result.textId;
        await sendTextToTelegram(result.text);
      }

      if (result.imageSrc && result.imageSrc !== lastImageSrc) {
        lastImageSrc = result.imageSrc;
        await sendImageToTelegram(result.imageSrc);
      }

    } catch (err) {
      console.error('⚠️ Message check error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5s
  }

  // Never close browser, keep it running
}

module.exports = { runBot };


