/**
 * Test Email Configuration
 * Run this to test if your email setup is working
 * Usage: node test-email.js
 */

require("dotenv").config();
const { sendVerificationEmail } = require("./src/utils/emailService");

async function testEmail() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TESTING EMAIL CONFIGURATION");
  console.log("=".repeat(80));
  console.log("");

  // Check configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("✅ SMTP Configuration Found:");
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Port: ${process.env.SMTP_PORT || "587"}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    console.log(`   From: ${process.env.EMAIL_FROM || process.env.SMTP_USER}`);
    console.log("");
  } else {
    console.log("⚠️  No SMTP Configuration Found");
    console.log("");
    console.log("To send real emails, add to .env file:");
    console.log("  SMTP_HOST=smtp.gmail.com");
    console.log("  SMTP_PORT=587");
    console.log("  SMTP_SECURE=false");
    console.log("  SMTP_USER=your-email@gmail.com");
    console.log("  SMTP_PASS=your-app-password");
    console.log("  EMAIL_FROM=your-email@gmail.com");
    console.log("");
    console.log("See QUICK_EMAIL_SETUP.md for detailed instructions");
    console.log("");
  }

  // Get test email
  const testEmail = process.argv[2] || process.env.SMTP_USER || "test@example.com";
  
  console.log(`Sending test email to: ${testEmail}`);
  console.log("");

  try {
    const testToken = "test-token-12345";
    const result = await sendVerificationEmail(testEmail, testToken, "Test User");
    
    console.log("");
    if (result.success) {
      if (result.mode === "console" || result.mode === "console-fallback") {
        console.log("⚠️  Email sent in console mode (no real email sent)");
        console.log("   Configure SMTP to send real emails");
      } else if (result.mode === "ethereal") {
        console.log("⚠️  Email sent to Ethereal (test service)");
        console.log(`   Preview URL: ${result.previewUrl}`);
        console.log("   This is NOT a real email - configure SMTP for real emails");
      } else {
        console.log("✅ Email sent successfully!");
        console.log("   Check your inbox (and spam folder)");
      }
    } else {
      console.log("❌ Email sending failed");
      console.log(`   Error: ${result.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("");
  console.log("=".repeat(80));
  console.log("");
}

testEmail();

