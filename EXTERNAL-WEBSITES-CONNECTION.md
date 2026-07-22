# How to Connect Your Website to ClickMasters CRM

> **Purpose:** This guide is for anyone on the ClickMasters team who needs to connect their website's contact form to our central CRM. No coding experience required — just copy, paste, and change 2 values.

---

## ✅ 3-Step Checklist

| Step | What to Do | Time |
|------|-----------|------|
| **1** | **Copy** the form code below and paste it into your website's contact page | 1 minute |
| **2** | **Change** the `website` and `service` values to match YOUR website (use the table below) | 30 seconds |
| **3** | **Test** with the console snippet in the "Testing" section to confirm it works | 1 minute |

**Total time: ~3 minutes per website.**

---

## 🎯 What This Does

Every time a visitor fills out a contact form on **your website**, the lead automatically goes to our central CRM at **crm.clickmasters.pk** — the same place where all ClickMasters leads from every website are collected.

You no longer need to check separate emails or form inboxes. **Everything is in one dashboard.**

---

## 🔌 Step 1: Copy This Code Into Your Website

Copy all of the code below and paste it into your website's contact page (usually `contact.html`, `contact.php`, or your theme's contact template).

> **Don't worry if you're not a developer.** Just paste it where your existing contact form code lives. If you're unsure where to put it, ask your web developer or send me a message.

```html
<form id="leadForm" onsubmit="return submitLead(event)">
  <input type="text" id="name" placeholder="Your Name" required />
  <input type="email" id="email" placeholder="Your Email" required />
  <input type="tel" id="phone" placeholder="Phone Number" />
  <textarea id="message" placeholder="Your Message"></textarea>

  <!-- ⚠️ IMPORTANT: Change these two values below for your website -->
  <input type="hidden" id="website" value="clickmasterssoftwaredevelopmentcompany.com" />
  <input type="hidden" id="service" value="Software Development" />

  <button type="submit">Send Message</button>
</form>

<script>
async function submitLead(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    message: document.getElementById('message').value,
    website: document.getElementById('website').value,
    service: document.getElementById('service').value,
    landingPage: window.location.href,
    referrer: document.referrer,
    utm_source: new URLSearchParams(window.location.search).get('utm_source') || '',
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || '',
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
    utm_term: new URLSearchParams(window.location.search).get('utm_term') || '',
    utm_content: new URLSearchParams(window.location.search).get('utm_content') || '',
  };

  try {
    const res = await fetch('https://crm.clickmasters.pk/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert('✅ Thank you! We will contact you shortly.');
      document.getElementById('leadForm').reset();
    } else {
      const err = await res.json();
      alert('❌ Error: ' + (err.error || 'Submission failed'));
    }
  } catch (err) {
    alert('❌ Network error. Please check your connection and try again.');
  }
  return false;
}
</script>
```

### Already Have an Existing Contact Form?

If your website already has a contact form and you just want to add the tracking, use this simpler version instead. Paste it before the `</body>` tag on your contact page:

```html
<script>
document.querySelector('form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = {
    name: this.querySelector('[name="name"]')?.value || '',
    email: this.querySelector('[name="email"]')?.value || '',
    phone: this.querySelector('[name="phone"]')?.value || '',
    message: this.querySelector('[name="message"]')?.value || '',
    website: 'clickmasterssoftwaredevelopmentcompany.com',  // ← CHANGE THIS
    service: 'Software Development',                        // ← CHANGE THIS
    landingPage: window.location.href,
    referrer: document.referrer,
    utm_source: new URLSearchParams(window.location.search).get('utm_source') || '',
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || '',
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
  };

  try {
    const res = await fetch('https://crm.clickmasters.pk/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert('✅ Thank you! We will contact you shortly.');
    }
  } catch (err) {
    console.error('Lead submission failed:', err);
  }
});
</script>
```

---

## 🧩 Step 2: Set the Right Values for YOUR Website

Find your website in the table below. Use the **exact** `website` and `service` values listed for your site.

| Your Website | Set `website` to | Set `service` to |
|-------------|-----------------|------------------|
| clickmasterssoftwaredevelopmentcompany.com | `clickmasterssoftwaredevelopmentcompany.com` | Software Development |
| clickmasterswebdevelopmentcompany.com | `clickmasterswebdevelopmentcompany.com` | Web Development |
| clickmastersmobiledevelopmentcompany.com | `clickmastersmobiledevelopmentcompany.com` | Mobile App Development |
| clickmastersartificialintelligencecompany.com | `clickmastersartificialintelligencecompany.com` | Artificial Intelligence |
| clickmastersblockchaintechnologies.com | `clickmastersblockchaintechnologies.com` | Blockchain |
| clickmastersdigitalmarketing.com | `clickmastersdigitalmarketing.com` | Digital Marketing |
| clickmastersaiautomation.com | `clickmastersaiautomation.com` | Automation |
| clickmastersapplicationdevelopment.com | `clickmastersapplicationdevelopment.com` | Software Development |
| clickmasterssoftwaredevelopmentcompany.co.uk | `clickmasterssoftwaredevelopmentcompany.co.uk` | Software Development |
| clickmastersartificialintelligencecompany.co.uk | `clickmastersartificialintelligencecompany.co.uk` | Artificial Intelligence |

**Where to change these values?**
In the code you copied, look for these two lines and replace them with your website's values:

```html
<input type="hidden" id="website" value="PASTE_YOUR_WEBSITE_HERE" />
<input type="hidden" id="service" value="PASTE_YOUR_SERVICE_HERE" />
```

---

## 🔍 Step 3: Test If It Works

After adding the code to your website, test it to make sure everything is connected properly.

1. Open your website in Google Chrome
2. Right-click anywhere on the page and click **"Inspect"** (or press **F12**)
3. Click the **"Console"** tab at the top
4. Copy and paste the following code into the console, then press **Enter**:

```javascript
fetch('https://crm.clickmasters.pk/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@clickmasters.com',
    website: 'clickmasterssoftwaredevelopmentcompany.com',  // ← use YOUR website
    service: 'Web Development',
    message: 'Testing connection to CRM.',
    landingPage: window.location.href,
    referrer: document.referrer,
  })
})
.then(r => r.json())
.then(d => console.log('✅ SUCCESS:', d))
.catch(e => console.error('❌ FAILED:', e));
```

### What to Expect

| If you see this | Meaning |
|----------------|---------|
| `✅ SUCCESS: { _id: "..." , createdAt: "..." }` | **It works!** Your website is now sending leads to the CRM |
| `❌ FAILED` or `❌ Error` | Something is wrong. Check the troubleshooting section below |

After a successful test, go to **https://crm.clickmasters.pk** and log in. You should see your test lead in the dashboard.

> **Important:** Delete the test lead from the dashboard after confirming it works, so it doesn't mix with real leads.

---

## 📦 What Data Gets Sent (For Reference)

When someone fills out your form, this is exactly what gets sent and saved:

| Field | Required? | What it is |
|-------|-----------|------------|
| `name` | ✅ Yes | Visitor's name |
| `email` | ✅ Yes | Visitor's email |
| `phone` | ❌ No | Phone number (optional) |
| `company` | ❌ No | Company name (optional) |
| `message` | ❌ No | Their message (optional) |
| `website` | ✅ Yes | **Your website domain** — this is how we know which site the lead came from |
| `service` | ❌ No | Which service they're interested in |
| `landingPage` | ❌ No | The exact page URL where they filled the form (auto-captured) |
| `referrer` | ❌ No | Where they came from (Google, Facebook, etc. — auto-captured) |

Plus, the system automatically captures: **IP address, browser type, device type (mobile/desktop/tablet), operating system, country, and city.**

---

## 🚨 Troubleshooting (If Something Goes Wrong)

### ❌ Error: `{"error": "Unauthorized"}`

**This is the most common issue.** It usually means the form is sending a GET request instead of POST.

✅ **Fix:** 
- If you used a plain `<form>` tag, make sure it has `method="POST"` in it: `<form method="POST">`
- Or switch to the JavaScript code provided above (the JS version always uses POST correctly)
- Also make sure the URL starts with **https://** (not http://)

### ❌ Error: `{"error": "Validation failed"}`

**You're missing a required field.** Make sure your form has `name`, `email`, and `website` fields — these are mandatory.

### ❌ Error: CORS or "Cross-Origin Request Blocked"

**Rare issue.** Try a different browser (Chrome, Edge) or disable any browser extensions that block cross-site tracking.

### ❌ Form submits but nothing appears in dashboard

**Wrong URL.** Make sure the form submits to exactly this (copy-paste it):
```
https://crm.clickmasters.pk/api/leads
```

### Still Stuck?

Ask in the team group or message me directly. Include a screenshot of any error message you see.

---

## ⚡ What Happens After a Visitor Submits

1. **Lead is saved** in our central database with all details
2. **Visitor gets an auto-reply email** thanking them for their inquiry
3. **Team gets notified** at `software.clickmasters@gmail.com`
4. **Lead appears instantly** in the dashboard at `https://crm.clickmasters.pk`

---

## 📝 Quick Reminders

- The form submission endpoint is **public** — no password needed
- The dashboard login is **separate** — only admins can view leads
- Always use **https://** not http://
- Each lead starts with status **"New"** — you can change it in the dashboard
- The system allows up to **100 submissions per minute** per website — plenty for normal traffic
