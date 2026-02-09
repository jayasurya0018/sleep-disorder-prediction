# Gmail App Password Setup (For Email Service)

## Quick Steps to Get App Password

### Step 1: Enable 2-Factor Authentication
1. Go to **myaccount.google.com**
2. Click **Security** (left sidebar)
3. Scroll down to **2-Step Verification**
4. Click **Enable 2-Step Verification**
   - Follow prompts to verify your phone
   - This is required to generate app passwords

### Step 2: Generate App Password
1. Go back to **Security** in myaccount.google.com
2. Scroll to **App passwords** (appears only after 2FA is enabled)
3. Select:
   - **App:** Mail
   - **Device:** Windows PC (or your device type)
4. Click **Generate**
5. Google will show a **16-character password** like: `xxxx xxxx xxxx xxxx`

### Step 3: Copy the Password
```
Example: abcd efgh ijkl mnop
```
- Copy this (without spaces) to use as EMAIL_PASSWORD
- Google won't show it again, so save it somewhere safe

### Step 4: Add to .env

```bash
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
DASHBOARD_URL=http://localhost:3001/live-monitoring
```

**Important:** Use the 16-character password, NOT your regular Gmail password!

---

## Common Issues

### ❌ "Invalid credentials" error
**Solution:** 
- Make sure you used the 16-char APP PASSWORD, not your regular password
- Remove any spaces if you copied: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### ❌ "2-Step Verification not enabled"
**Solution:**
- App passwords only work if 2FA is enabled
- Enable 2FA first at myaccount.google.com/security

### ❌ 14-day timeout
If you don't use the app password within 14 days, Google disables it. Just generate a new one.

---

## Testing the Setup

Once you have EMAIL_USER and EMAIL_PASSWORD set in `.env`:

```bash
# Start the server
cd server
npm start

# In another terminal, test the email:
curl -X POST http://localhost:5000/api/email/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Should return:
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "<...@gmail.com>",
  "recipient": "your-email@gmail.com"
}
```

---

## For Production (Different Email Provider)

Gmail is fine for development, but for production consider:

### Option 1: Gmail (Simple)
- Pros: Free, works immediately
- Cons: Lower rate limits (100-500/hour), may trigger spam filters
- Best for: Development, small deployments

### Option 2: SendGrid (Recommended)
- Pros: 100K free emails/month, better deliverability
- Cons: Need API key
- Setup:
  ```bash
  npm install @sendgrid/mail
  
  # .env
  SENDGRID_API_KEY=your_api_key_here
  ```

### Option 3: AWS SES (Production Scale)
- Pros: Very cheap at scale ($0.10/1000), excellent deliverability
- Cons: Requires AWS account
- Setup:
  ```bash
  npm install aws-sdk
  
  # .env
  AWS_SES_REGION=us-east-1
  AWS_ACCESS_KEY_ID=your_key
  AWS_SECRET_ACCESS_KEY=your_secret
  ```

---

## Quick Reference

| Provider | Setup Time | Free Limit | Rate Limit |
|----------|-----------|-----------|-----------|
| Gmail | 5 min | Unlimited* | 500/hour |
| SendGrid | 10 min | 100K/month | 10K/hour |
| AWS SES | 15 min | 62K/month | 14/second |

*Gmail's "unlimited" assumes personal use; may be throttled for bulk sending

---

## Your Current Status

✅ Email service ready  
⏳ Waiting for: EMAIL_USER and EMAIL_PASSWORD in .env

Once set, run:
```bash
npm start
# Server will initialize email service successfully
```

Then test with the curl command above to verify it works.

---

**Estimated time to setup:** 5-10 minutes
