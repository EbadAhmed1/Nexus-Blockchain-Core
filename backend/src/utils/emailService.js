
const nodemailer = require("nodemailer");


const createTransporter = async () => {

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    try {
      await transporter.verify();
      console.log("✅ SMTP server connection verified successfully");
      return transporter;
    } catch (error) {
      console.error("❌ SMTP connection verification failed:", error.message);
      console.error("⚠️  Falling back to console logging mode");
      return null;
    }
  }


  try {
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {

      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS,
        },
      });
    } else {

      const testAccount = await nodemailer.createTestAccount();
      console.log("📧 Created Ethereal test account for email testing");
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  } catch (error) {
    console.warn("⚠️ Could not create Ethereal account, emails will be logged to console only");

    return null;
  }
};

const sendVerificationEmail = async (email, code, fullName) => {

  console.log("\n" + "=".repeat(80));
  console.log("📧 EMAIL VERIFICATION CODE");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`Verification Code: ${code}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();

    if (!transporter) {
      console.log("⚠️  Email service not configured. Using console logging for development.");
      console.log("⚠️  In production, emails MUST be sent for security!");
      return { success: true, code, mode: "console", emailSent: false };
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";//localhost:3000";//localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: "Verify Your Email - Blockchain Explorer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .code-box { background: #fff; border: 3px solid #DC2626; padding: 25px; border-radius: 5px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #DC2626; }
            .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>Thank you for registering with Blockchain Explorer! Please verify your email address to complete your registration.</p>
              
              <p><strong>Your verification code is:</strong></p>
              <div class="code-box">${code}</div>
              
              <div class="info-box">
                <p><strong>How to verify:</strong></p>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Go to the verification page</li>
                  <li>Enter the 6-digit code above</li>
                  <li>Click "Verify Email"</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${verifyUrl}" class="button">Go to Verification Page</a>
              </div>
              
              <p><strong>This code will expire in 24 hours.</strong></p>
              
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        Thank you for registering with Blockchain Explorer! Please verify your email address to complete your registration.
        
        Your verification code is: ${code}
        
        Go to ${verifyUrl} and enter this code to verify your email.
        
        This code will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("\n" + "=".repeat(80));
      console.log("📧 EMAIL PREVIEW (Ethereal Email - Test Mode)");
      console.log("=".repeat(80));
      console.log(`⚠️  This is a TEST email. It was NOT sent to ${email}`);
      console.log(`Preview URL: ${previewUrl}`);
      console.log("You can view the email by opening this URL in your browser");
      console.log("⚠️  Configure real SMTP to send actual emails!");
      console.log("=".repeat(80) + "\n");
      return { 
        success: true, 
        messageId: info.messageId, 
        previewUrl: previewUrl,
        token,
        verificationUrl,
        mode: "ethereal",
        emailSent: false
      };
    } else {
      console.log("\n" + "=".repeat(80));
      console.log("✅ VERIFICATION EMAIL SENT SUCCESSFULLY");
      console.log("=".repeat(80));
      console.log(`To: ${email}`);
      console.log(`Message ID: ${info.messageId}`);
      console.log("Please check your inbox (and spam folder)");
      console.log("=".repeat(80) + "\n");
      return { 
        success: true, 
        messageId: info.messageId, 
        previewUrl: null,
        code,
        mode: "smtp",
        emailSent: true
      };
    }
  } catch (error) {
    console.error("\n❌ Error sending verification email:", error.message);
    console.error("Full error:", error);

    if (process.env.NODE_ENV !== "production") {
      console.log("\n⚠️  Email sending failed, but continuing in development mode.");
      console.log("📧 You can still verify your email using the token above.");
      console.log("⚠️  In production, email sending MUST succeed!");
      return { 
        success: true, 
        error: error.message, 
        code,
        mode: "console-fallback",
        emailSent: false
      };
    }

    console.error("❌ CRITICAL: Email sending failed in production mode!");
    throw error;
  }
};

const sendResendVerificationEmail = async (email, token, fullName) => {
  return sendVerificationEmail(email, token, fullName);
};

const sendDeleteAccountCode = async (email, code, fullName) => {

  console.log("\n" + "=".repeat(80));
  console.log("📧 ACCOUNT DELETION VERIFICATION CODE");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`Verification Code: ${code}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();

    if (!transporter) {
      console.log("ℹ️  Email service not configured. Using console logging for development.");
      return { success: true, code, mode: "console" };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: "Account Deletion Verification Code - Blockchain Explorer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .code-box { background: #fff; border: 3px solid #DC2626; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #DC2626; }
            .warning { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Deletion Request</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>You have requested to delete your Blockchain Explorer account. To confirm this action, please use the verification code below:</p>
              
              <div class="code-box">${code}</div>
              
              <div class="warning">
                <p><strong>⚠️ Warning:</strong></p>
                <p>This action is <strong>irreversible</strong>. Once your account is deleted:</p>
                <ul>
                  <li>All your data will be permanently removed</li>
                  <li>All your wallets and token holdings will be deleted</li>
                  <li>All your transaction history will be lost</li>
                  <li>You will not be able to recover your account</li>
                </ul>
              </div>
              
              <p><strong>This code will expire in 15 minutes.</strong></p>
              
              <p>If you did not request this, please ignore this email and your account will remain safe.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        You have requested to delete your Blockchain Explorer account. To confirm this action, please use the verification code below:
        
        Verification Code: ${code}
        
        ⚠️ WARNING: This action is IRREVERSIBLE. Once your account is deleted, all your data, wallets, and transaction history will be permanently removed.
        
        This code will expire in 15 minutes.
        
        If you did not request this, please ignore this email and your account will remain safe.
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("\n📧 Delete account email preview URL:", previewUrl);
    } else {
      console.log("✅ Delete account verification code sent to:", email);
    }
    
    return { 
      success: true, 
      messageId: info.messageId, 
      previewUrl: previewUrl,
      code,
      mode: previewUrl ? "ethereal" : "smtp"
    };
  } catch (error) {
    console.error("❌ Error sending delete account verification email:", error.message);

    if (process.env.NODE_ENV !== "production") {
      console.log("⚠️  Email sending failed, but continuing in development mode.");
      console.log("📧 You can still use the verification code above.");
      return { 
        success: true, 
        error: error.message, 
        code,
        mode: "console-fallback"
      };
    }

    throw error;
  }
};

const sendLoginVerificationCode = async (email, fullName, code) => {
  console.log("\n" + "=".repeat(80));
  console.log("📧 LOGIN VERIFICATION CODE");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`Verification Code: ${code}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log("ℹ️  Email service not configured. Using console logging for development.");
      return { success: true, code, mode: "console", emailSent: false };
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";//localhost:3000";
    const loginUrl = `${baseUrl}/login`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: "🔐 Login Verification Code - Blockchain Explorer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .code-box { background: #fff; border: 3px solid #DC2626; padding: 25px; border-radius: 5px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #DC2626; }
            .info-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Login Verification</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>You have requested to sign in to your Blockchain Explorer account. Please use the verification code below to complete your login:</p>
              
              <p><strong>Your verification code is:</strong></p>
              <div class="code-box">${code}</div>
              
              <div class="info-box">
                <p><strong>How to complete login:</strong></p>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Enter the 6-digit code above on the login page</li>
                  <li>Click "Verify & Sign In"</li>
                  <li>You will be logged in successfully</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Go to Login Page</a>
              </div>
              
              <p><strong>This code will expire in 15 minutes.</strong></p>
              
              <p>If you didn't request this login, please ignore this email and secure your account.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        You have requested to sign in to your Blockchain Explorer account. Please use the verification code below to complete your login:
        
        Your verification code is: ${code}
        
        Go to ${loginUrl} and enter this code to complete your login.
        
        This code will expire in 15 minutes.
        
        If you didn't request this login, please ignore this email and secure your account.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log("📧 Login verification code sent to Ethereal (test mode)");
      console.log(`Preview URL: ${previewUrl}`);
      return { success: true, mode: "ethereal", emailSent: false, previewUrl, code };
    } else {
      console.log("✅ Login verification code email sent successfully to:", email);
      return { success: true, mode: "smtp", emailSent: true, messageId: info.messageId, code };
    }
  } catch (error) {
    console.error("❌ Error sending login verification code email:", error.message);
    if (process.env.NODE_ENV !== "production") {
      return { success: true, error: error.message, code, mode: "console-fallback", emailSent: false };
    }
    throw error;
  }
};

const sendLoginNotification = async (email, fullName, loginTime, ipAddress, userAgent) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  console.log("\n" + "=".repeat(80));
  console.log("📧 LOGIN NOTIFICATION");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`Login Time: ${loginTime}`);
  console.log(`IP Address: ${ipAddress || "Not available"}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log("ℹ️  Email service not configured. Using console logging for development.");
      return { success: true, mode: "console", emailSent: false };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: "🔐 New Login Detected - Blockchain Explorer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .info-box { background: #fff; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .warning { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 New Login Detected</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>We detected a new login to your Blockchain Explorer account.</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Login Time:</span>
                  <span class="info-value">${loginTime}</span>
                </div>
                ${ipAddress ? `
                <div class="info-row">
                  <span class="info-label">IP Address:</span>
                  <span class="info-value">${ipAddress}</span>
                </div>
                ` : ''}
                ${userAgent ? `
                <div class="info-row">
                  <span class="info-label">Device:</span>
                  <span class="info-value">${userAgent.substring(0, 50)}${userAgent.length > 50 ? '...' : ''}</span>
                </div>
                ` : ''}
              </div>

              ${ipAddress ? `
              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you didn't log in, please secure your account immediately:</p>
                <ul>
                  <li>Change your password</li>
                  <li>Review your account activity</li>
                  <li>Contact support if needed</li>
                </ul>
              </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard" class="button">Go to Dashboard</a>
              </div>

              <p>If this was you, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        We detected a new login to your Blockchain Explorer account.
        
        Login Time: ${loginTime}
        ${ipAddress ? `IP Address: ${ipAddress}` : ''}
        ${userAgent ? `Device: ${userAgent}` : ''}
        
        ${ipAddress ? `
        ⚠️ SECURITY NOTICE:
        If you didn't log in, please secure your account immediately by changing your password.
        ` : ''}
        
        If this was you, you can safely ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log("📧 Login notification sent to Ethereal (test mode)");
      console.log(`Preview URL: ${previewUrl}`);
      return { success: true, mode: "ethereal", emailSent: false, previewUrl };
    } else {
      console.log("✅ Login notification email sent successfully to:", email);
      return { success: true, mode: "smtp", emailSent: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("❌ Error sending login notification email:", error.message);
    if (process.env.NODE_ENV !== "production") {
      return { success: true, error: error.message, mode: "console-fallback", emailSent: false };
    }
    throw error;
  }
};

const sendTransactionNotification = async (email, fullName, transactionDetails) => {
  const {
    txHash,
    fromAddress,
    toAddress,
    tokenSymbol,
    amount,
    fee,
    status,
    timestamp,
    method = "transfer"
  } = transactionDetails;

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const txUrl = `${baseUrl}/transactions/${txHash}`;
  
  console.log("\n" + "=".repeat(80));
  console.log("📧 TRANSACTION NOTIFICATION");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Amount: ${amount} ${tokenSymbol}`);
  console.log(`Status: ${status}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log("ℹ️  Email service not configured. Using console logging for development.");
      return { success: true, mode: "console", emailSent: false };
    }

    const isOutgoing = transactionDetails.isOutgoing || false;
    const transactionType = isOutgoing ? "Sent" : "Received";
    const transactionColor = isOutgoing ? "#DC2626" : "#10B981";
    const transactionIcon = isOutgoing ? "📤" : "📥";

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: `${transactionIcon} Transaction ${status === 'confirmed' ? 'Confirmed' : status} - ${amount} ${tokenSymbol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${transactionColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .info-box { background: #fff; border-left: 4px solid ${transactionColor}; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; font-family: monospace; word-break: break-all; }
            .amount-box { background: ${transactionColor}; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .amount-value { font-size: 32px; font-weight: bold; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-confirmed { background: #10B981; color: white; }
            .status-pending { background: #F59E0B; color: white; }
            .status-failed { background: #EF4444; color: white; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: ${transactionColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${transactionIcon} Transaction ${transactionType}</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>Your transaction has been ${status === 'confirmed' ? 'confirmed' : status}.</p>
              
              <div class="amount-box">
                <div class="amount-value">${isOutgoing ? '-' : '+'}${parseFloat(amount).toLocaleString()} ${tokenSymbol}</div>
                <div style="margin-top: 10px; opacity: 0.9;">
                  <span class="status-badge status-${status}">${status.toUpperCase()}</span>
                </div>
              </div>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Transaction Hash:</span>
                  <span class="info-value">${txHash}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${method.toUpperCase()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">From:</span>
                  <span class="info-value">${fromAddress}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">To:</span>
                  <span class="info-value">${toAddress}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Amount:</span>
                  <span class="info-value">${parseFloat(amount).toLocaleString()} ${tokenSymbol}</span>
                </div>
                ${fee > 0 ? `
                <div class="info-row">
                  <span class="info-label">Fee:</span>
                  <span class="info-value">${parseFloat(fee).toLocaleString()} ${tokenSymbol}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span class="info-value">${new Date(timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${txUrl}" class="button">View Transaction Details</a>
              </div>

              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                If you didn't make this transaction, please contact support immediately.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        Your transaction has been ${status === 'confirmed' ? 'confirmed' : status}.
        
        Transaction Details:
        - Hash: ${txHash}
        - Type: ${transactionType} (${method})
        - From: ${fromAddress}
        - To: ${toAddress}
        - Amount: ${parseFloat(amount).toLocaleString()} ${tokenSymbol}
        ${fee > 0 ? `- Fee: ${parseFloat(fee).toLocaleString()} ${tokenSymbol}` : ''}
        - Status: ${status.toUpperCase()}
        - Time: ${new Date(timestamp).toLocaleString()}
        
        View transaction: ${txUrl}
        
        If you didn't make this transaction, please contact support immediately.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log("📧 Transaction notification sent to Ethereal (test mode)");
      console.log(`Preview URL: ${previewUrl}`);
      return { success: true, mode: "ethereal", emailSent: false, previewUrl };
    } else {
      console.log("✅ Transaction notification email sent successfully to:", email);
      return { success: true, mode: "smtp", emailSent: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("❌ Error sending transaction notification email:", error.message);
    if (process.env.NODE_ENV !== "production") {
      return { success: true, error: error.message, mode: "console-fallback", emailSent: false };
    }
    throw error;
  }
};

const sendP2PRequestNotification = async (email, fullName, requestDetails) => {
  const {
    p2pTxId,
    buyerName,
    sellerName,
    tokenSymbol,
    amount,
    price,
    total,
    isSeller
  } = requestDetails;

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const p2pUrl = `${baseUrl}/p2p-transactions`;
  
  console.log("\n" + "=".repeat(80));
  console.log("📧 P2P REQUEST NOTIFICATION");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`P2P Transaction ID: ${p2pTxId}`);
  console.log(`Role: ${isSeller ? "Seller" : "Buyer"}`);
  console.log(`Amount: ${amount} ${tokenSymbol}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log("ℹ️  Email service not configured. Using console logging for development.");
      return { success: true, mode: "console", emailSent: false };
    }

    const roleText = isSeller ? "You have received a P2P transaction request" : "Your P2P transaction request has been sent";
    const actionText = isSeller ? "Please review and accept or decline the request" : "Waiting for seller to accept";

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: `📬 P2P Transaction Request - ${amount} ${tokenSymbol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .info-box { background: #fff; border-left: 4px solid #3B82F6; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .amount-box { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .amount-value { font-size: 28px; font-weight: bold; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button-danger { background: #DC2626; }
            .button-success { background: #10B981; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 P2P Transaction Request</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>${roleText}.</p>
              
              <div class="amount-box">
                <div class="amount-value">${parseFloat(amount).toLocaleString()} ${tokenSymbol}</div>
                <div style="margin-top: 10px; opacity: 0.9;">Total: $${parseFloat(total).toLocaleString()}</div>
              </div>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Transaction ID:</span>
                  <span class="info-value">#${p2pTxId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">${isSeller ? "Buyer:" : "Seller:"}</span>
                  <span class="info-value">${isSeller ? buyerName : sellerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Token:</span>
                  <span class="info-value">${tokenSymbol}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Amount:</span>
                  <span class="info-value">${parseFloat(amount).toLocaleString()} ${tokenSymbol}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Price per token:</span>
                  <span class="info-value">$${parseFloat(price).toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total:</span>
                  <span class="info-value">$${parseFloat(total).toLocaleString()}</span>
                </div>
              </div>

              ${isSeller ? `
              <p><strong>Action Required:</strong> Please review this request and accept or decline it.</p>
              <div style="text-align: center;">
                <a href="${p2pUrl}" class="button button-success">View & Accept</a>
                <a href="${p2pUrl}" class="button button-danger">View & Decline</a>
              </div>
              ` : `
              <p>Your request has been sent to the seller. You will be notified when they respond.</p>
              <div style="text-align: center;">
                <a href="${p2pUrl}" class="button">View Transaction</a>
              </div>
              `}

              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                You can also manage this transaction from your dashboard.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        ${roleText}.
        
        Transaction Details:
        - ID: #${p2pTxId}
        - ${isSeller ? "Buyer" : "Seller"}: ${isSeller ? buyerName : sellerName}
        - Token: ${tokenSymbol}
        - Amount: ${parseFloat(amount).toLocaleString()} ${tokenSymbol}
        - Price: $${parseFloat(price).toLocaleString()} per token
        - Total: $${parseFloat(total).toLocaleString()}
        
        ${isSeller ? "Please review and accept or decline this request." : "Waiting for seller to accept."}
        
        View transaction: ${p2pUrl}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log("📧 P2P request notification sent to Ethereal (test mode)");
      console.log(`Preview URL: ${previewUrl}`);
      return { success: true, mode: "ethereal", emailSent: false, previewUrl };
    } else {
      console.log("✅ P2P request notification email sent successfully to:", email);
      return { success: true, mode: "smtp", emailSent: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("❌ Error sending P2P request notification email:", error.message);
    if (process.env.NODE_ENV !== "production") {
      return { success: true, error: error.message, mode: "console-fallback", emailSent: false };
    }
    throw error;
  }
};

const sendP2PFulfillmentNotification = async (email, fullName, fulfillmentDetails) => {
  const {
    p2pTxId,
    buyerName,
    sellerName,
    tokenSymbol,
    amount,
    price,
    total,
    status,
    isSeller
  } = fulfillmentDetails;

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const p2pUrl = `${baseUrl}/p2p-transactions`;
  
  console.log("\n" + "=".repeat(80));
  console.log("📧 P2P FULFILLMENT NOTIFICATION");
  console.log("=".repeat(80));
  console.log(`Email: ${email}`);
  console.log(`P2P Transaction ID: ${p2pTxId}`);
  console.log(`Status: ${status}`);
  console.log(`Amount: ${amount} ${tokenSymbol}`);
  console.log("=".repeat(80) + "\n");

  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log("ℹ️  Email service not configured. Using console logging for development.");
      return { success: true, mode: "console", emailSent: false };
    }

    const statusMessages = {
      'paid': 'has been accepted and is waiting for payment',
      'completed': 'has been completed successfully',
      'cancelled': 'has been cancelled',
      'rejected': 'has been rejected'
    };

    const statusMessage = statusMessages[status] || `status changed to ${status}`;
    const statusColor = status === 'completed' ? '#10B981' : status === 'cancelled' || status === 'rejected' ? '#DC2626' : '#3B82F6';

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@blockchain-explorer.com",
      to: email,
      subject: `✅ P2P Transaction ${status === 'completed' ? 'Completed' : status.charAt(0).toUpperCase() + status.slice(1)} - ${amount} ${tokenSymbol}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .info-box { background: #fff; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .amount-box { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; }
            .amount-value { font-size: 28px; font-weight: bold; }
            .button { display: inline-block; background: ${statusColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${status === 'completed' ? '✅' : status === 'cancelled' || status === 'rejected' ? '❌' : '📬'} P2P Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName || "there"},</p>
              <p>Your P2P transaction ${statusMessage}.</p>
              
              <div class="amount-box">
                <div class="amount-value">${parseFloat(amount).toLocaleString()} ${tokenSymbol}</div>
                <div style="margin-top: 10px; opacity: 0.9;">Total: $${parseFloat(total).toLocaleString()}</div>
              </div>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Transaction ID:</span>
                  <span class="info-value">#${p2pTxId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Buyer:</span>
                  <span class="info-value">${buyerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Seller:</span>
                  <span class="info-value">${sellerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Token:</span>
                  <span class="info-value">${tokenSymbol}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Amount:</span>
                  <span class="info-value">${parseFloat(amount).toLocaleString()} ${tokenSymbol}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Price per token:</span>
                  <span class="info-value">$${parseFloat(price).toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total:</span>
                  <span class="info-value">$${parseFloat(total).toLocaleString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value"><strong>${status.toUpperCase()}</strong></span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${p2pUrl}" class="button">View Transaction Details</a>
              </div>

              ${status === 'completed' ? `
              <p style="margin-top: 20px; padding: 15px; background: #D1FAE5; border-left: 4px solid #10B981; border-radius: 5px;">
                ✅ Transaction completed successfully! Tokens have been transferred.
              </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Blockchain Explorer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${fullName || "there"},
        
        Your P2P transaction ${statusMessage}.
        
        Transaction Details:
        - ID: #${p2pTxId}
        - Buyer: ${buyerName}
        - Seller: ${sellerName}
        - Token: ${tokenSymbol}
        - Amount: ${parseFloat(amount).toLocaleString()} ${tokenSymbol}
        - Price: $${parseFloat(price).toLocaleString()} per token
        - Total: $${parseFloat(total).toLocaleString()}
        - Status: ${status.toUpperCase()}
        
        View transaction: ${p2pUrl}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    if (previewUrl) {
      console.log("📧 P2P fulfillment notification sent to Ethereal (test mode)");
      console.log(`Preview URL: ${previewUrl}`);
      return { success: true, mode: "ethereal", emailSent: false, previewUrl };
    } else {
      console.log("✅ P2P fulfillment notification email sent successfully to:", email);
      return { success: true, mode: "smtp", emailSent: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("❌ Error sending P2P fulfillment notification email:", error.message);
    if (process.env.NODE_ENV !== "production") {
      return { success: true, error: error.message, mode: "console-fallback", emailSent: false };
    }
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResendVerificationEmail,
  sendDeleteAccountCode,
  sendLoginVerificationCode,
  sendLoginNotification,
  sendTransactionNotification,
  sendP2PRequestNotification,
  sendP2PFulfillmentNotification,
};

