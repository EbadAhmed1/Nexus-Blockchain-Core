# SMTP Configuration Guide

## Environment Variables

Add these variables to your `.env` file in `Blockscan-Backend-main/`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Blockchain Explorer"
4. Click "Generate"
5. Copy the 16-character password (format: `abcd efgh ijkl mnop`)
6. Remove spaces and use as `SMTP_PASS`

## Configuration Details

### SMTP Settings
- **Host**: `smtp.gmail.com` (Gmail) or your SMTP server
- **Port**: `587` (TLS) or `465` (SSL)
- **Secure**: `false` for port 587, `true` for port 465
- **User**: Your full email address
- **Pass**: App password (not your regular password)

### Email Types Sent

1. **Email Verification** (Signup)
   - 6-digit code
   - Expires in 15 minutes
   - Type: `signup`

2. **Login Verification**
   - 6-digit code
   - Expires in 15 minutes
   - Type: `login_verification`

3. **Account Deletion**
   - 6-digit code
   - Expires in 15 minutes
   - Type: `account_deletion`

4. **Login Notification**
   - Sent after successful login
   - Includes IP address and device info

5. **Transaction Notification**
   - Sent for all transactions
   - Includes transaction details

6. **P2P Request Notification**
   - Sent when P2P transaction is created
   - Type: `p2p_request`

7. **P2P Fulfillment Notification**
   - Sent when P2P transaction is completed
   - Includes completion details

## Development Mode

If SMTP is not configured, the system will:
- Log verification codes to console
- Use Ethereal Email for testing (if available)
- Fall back to console logging

## Testing

Run the test script:
```bash
node scripts/test-email.js your-email@example.com
```

## Troubleshooting

### Common Issues

1. **"Invalid login" error**
   - Use App Password, not regular password
   - Ensure 2-Step Verification is enabled

2. **Connection timeout**
   - Check firewall settings
   - Verify SMTP port is open

3. **Emails not received**
   - Check spam folder
   - Verify SMTP credentials
   - Check email service logs

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords, not regular passwords
- Rotate App Passwords regularly
- Use environment-specific configurations

