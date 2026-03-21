/**
 * Resend Email Service
 * Handles transactional emails: confirmations, receipts, notifications
 * 
 * Setup: npm install resend
 * Get API key from: https://resend.com/api-keys
 */

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Policy Confirmation Email Template
 */
export function getPolicyConfirmationEmail(data: {
  userName: string;
  policyNumber: string;
  planName: string;
  premium: number;
  coverageAmount: number;
  startDate: Date;
  endDate: Date;
  email: string;
}): EmailTemplate {
  const formattedDate = (date: Date) => date.toLocaleDateString("en-IN");

  return {
    to: data.email,
    subject: `Your Saathi Insurance Policy ${data.policyNumber} is Active! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
            .section:last-child { border-bottom: none; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .value { font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 5px; }
            .btn { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Saathi! 🛡️</h1>
              <p>Your health insurance is now active</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              <p>Congratulations! Your insurance policy has been successfully purchased and is now active. You're now protected with comprehensive health coverage.</p>
              
              <div class="section">
                <div class="label">Policy Number</div>
                <div class="value">${data.policyNumber}</div>
              </div>
              
              <div class="section">
                <div class="label">Plan Details</div>
                <div style="margin-top: 10px;">
                  <p><strong>Plan:</strong> ${data.planName}</p>
                  <p><strong>Coverage Amount:</strong> ₹${data.coverageAmount.toLocaleString("en-IN")}</p>
                  <p><strong>Monthly Premium:</strong> ₹${data.premium.toLocaleString("en-IN")}</p>
                </div>
              </div>
              
              <div class="section">
                <div class="label">Policy Period</div>
                <div style="margin-top: 10px;">
                  <p><strong>Start Date:</strong> ${formattedDate(data.startDate)}</p>
                  <p><strong>End Date:</strong> ${formattedDate(data.endDate)}</p>
                </div>
              </div>
              
              <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0284c7; border-radius: 4px; margin-top: 20px;">
                <p><strong>What's Next?</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Download your policy document</li>
                  <li>Share details with family members</li>
                  <li>Find network hospitals near you</li>
                  <li>Understand your coverage in detail</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://saathiinsurance.com/dashboard" class="btn">View Your Policy</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Saathi Health Insurance | support@saathiinsurance.com | +91-XXXXXXXXXX</p>
              <p>This is a transactional email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Claim Submitted Email Template
 */
export function getClaimSubmittedEmail(data: {
  userName: string;
  claimNumber: string;
  policyNumber: string;
  hospitalName: string;
  claimAmount: number;
  email: string;
}): EmailTemplate {
  return {
    to: data.email,
    subject: `Claim ${data.claimNumber} Submitted Successfully ✓`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Claim Submitted ✓</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              <p>Your insurance claim has been submitted successfully. Our team is reviewing your documents and will get back to you within 5-7 business days.</p>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
                <p><strong>Claim Details</strong></p>
                <p><strong>Claim Number:</strong> ${data.claimNumber}</p>
                <p><strong>Policy Number:</strong> ${data.policyNumber}</p>
                <p><strong>Hospital:</strong> ${data.hospitalName}</p>
                <p><strong>Claim Amount:</strong> ₹${data.claimAmount.toLocaleString("en-IN")}</p>
              </div>
              
              <p><strong>Track Your Claim:</strong> Log in to your dashboard to view real-time updates on your claim status.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Claim Approved Email Template
 */
export function getClaimApprovedEmail(data: {
  userName: string;
  claimNumber: string;
  claimAmount: number;
  settledAmount: number;
  email: string;
}): EmailTemplate {
  return {
    to: data.email,
    subject: `Your Claim ${data.claimNumber} Has Been Approved! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .amount { font-size: 28px; font-weight: bold; color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Claim Approved! 🎉</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              <p>Great news! Your insurance claim has been approved and you'll receive the settled amount soon.</p>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #666; margin: 0;">Settled Amount</p>
                <p class="amount">₹${data.settledAmount.toLocaleString("en-IN")}</p>
                <p style="color: #666; font-size: 12px;">Claim Amount: ₹${data.claimAmount.toLocaleString("en-IN")}</p>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Amount will be transferred to your account within 3-5 business days</li>
                <li>You'll receive a detailed settlement report</li>
                <li>Keep the receipt for your records</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Policy Renewal Reminder Email Template
 */
export function getPolicyRenewalEmail(data: {
  userName: string;
  policyNumber: string;
  renewalDate: Date;
  premium: number;
  email: string;
}): EmailTemplate {
  const daysUntilRenewal = Math.ceil(
    (data.renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    to: data.email,
    subject: `Time to Renew Your Policy ${data.policyNumber} 📋`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Renewal Reminder 📋</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              <p>Your insurance policy is expiring in <strong>${daysUntilRenewal} days</strong>. Don't let your coverage lapse!</p>
              
              <div style="background-color: #fffbeb; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                <p><strong>Policy Renewal Details</strong></p>
                <p><strong>Policy Number:</strong> ${data.policyNumber}</p>
                <p><strong>Renewal Date:</strong> ${data.renewalDate.toLocaleDateString("en-IN")}</p>
                <p><strong>Renewal Premium:</strong> ₹${data.premium.toLocaleString("en-IN")}/month</p>
              </div>
              
              <p><strong>Renew Now and Get:</strong></p>
              <ul>
                <li>Continuous coverage without gaps</li>
                <li>Same benefits and features</li>
                <li>No waiting periods for existing conditions</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Send email using Resend API
 */
export async function sendEmail(template: EmailTemplate) {
  try {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
      console.error("Resend API key not configured");
      return { success: false, error: "Email service not configured" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: template.from || "Saathi Insurance <notifications@saathiinsurance.com>",
        to: template.to,
        subject: template.subject,
        html: template.html,
        reply_to: template.replyTo || "support@saathiinsurance.com",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" };
  }
}
