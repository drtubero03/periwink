import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
    if (!resendInstance) {
          resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

const FROM_EMAIL = "Periwink <hello@yourperiwink.com>";

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://periwink-hvwa5fgo5q-ue.a.run.app";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your email — Periwink",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F7F3EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 520px; margin: 0 auto; padding: 48px 24px;">
            <div style="text-align: center; margin-bottom: 36px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 300; color: #6E5A7E; margin: 0; letter-spacing: 0.5px;">periwink</h1>
            </div>
            <div style="background: #FDFBF8; border-radius: 20px; padding: 36px 32px; border: 1px solid #E8E3EA;">
              <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                Welcome to Periwink. One small step before you join — please verify your email address.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: #6E5A7E; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-family: -apple-system, sans-serif;">
                  Verify my email
                </a>
              </div>
              <p style="font-size: 14px; color: #9B94A3; line-height: 1.6; margin: 0;">
                This link expires in 24 hours. If you didn't create a Periwink account, you can safely ignore this email.
              </p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9B94A3; margin-top: 32px;">
              © ${new Date().getFullYear()} Periwink
            </p>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
}

export async function sendCommunityWelcome({
    to,
    name,
    pseudonym,
}: {
    to: string;
    name: string;
    pseudonym: string;
}) {
    try {
          await getResend().emails.send({
                  from: FROM_EMAIL,
                  to,
                  subject: "Welcome to Periwink 💜",
                  html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      </head>
                      <body style="margin: 0; padding: 0; background-color: #F7F3EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <div style="max-width: 520px; margin: 0 auto; padding: 48px 24px;">
                            <div style="text-align: center; margin-bottom: 36px;">
                                  <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 300; color: #6E5A7E; margin: 0; letter-spacing: 0.5px;">periwink</h1>
                                      </div>

                                              <div style="background: #FDFBF8; border-radius: 20px; padding: 36px 32px; border: 1px solid #E8E3EA;">
                                                    <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                            Dear ${name},
                                                                  </p>

                                                                              <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                                                      Thank you for joining Periwink. You're now part of something we're building together — a space where women navigating this transition can find each other, share what they're noticing, and feel held.
                                                                                            </p>

                                                                                                        <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                                                                                Your pseudonym: <strong style="color: #6E5A7E;">${pseudonym}</strong>
                                                                                                                      </p>
                                                                                                                            
                                                                                                                                  <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                                                                                                          We'll be in touch soon as we prepare to open the community. Until then, know that you're not carrying this alone.
                                                                                                                                                </p>
                                                                                                                                                      
                                                                                                                                                            <p style="font-size: 16px; color: #6B6575; line-height: 1.7; margin: 24px 0 0; font-style: italic;">
                                                                                                                                                                    With warmth,<br>
                                                                                                                                                                            The Periwink Team
                                                                                                                                                                                  </p>
                                                                                                                                                                                      </div>
                                                                                                                                                                                          
                                                                                                                                                                                              <p style="text-align: center; font-size: 12px; color: #9B94A3; margin-top: 32px;">
                                                                                                                                                                                                    © ${new Date().getFullYear()} Periwink · You're receiving this because you signed up at yourperiwink.com
                                                                                                                                                                                                        </p>
                                                                                                                                                                                                          </div>
                                                                                                                                                                                                          </body>
                                                                                                                                                                                                          </html>
                                                                                                                                                                                                                `,
          });
          return { success: true };
    } catch (error) {
          console.error("Failed to send community welcome email:", error);
          return { success: false, error };
    }
}

export async function sendFoundersNote({
  to,
  name,
}: {
  to: string;
  name?: string;
}) {
  const greeting = name ? `Dear ${name},` : "Hello,";

  try {
    await getResend().emails.send({
      from: "Adrian Tubero at Periwink <hello@yourperiwink.com>",
      to,
      subject: "A note from the founder",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F5F0;">
    <tr>
      <td align="center" style="padding: 48px 16px 56px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom: 44px;">
              <div style="display: inline-block; padding: 0 0 16px; border-bottom: 1px solid rgba(183,168,201,0.35);">
                <img src="https://www.yourperiwink.com/periwink-logo.svg" alt="periwink" width="140" height="62" style="display: block; border: 0;">
              </div>
            </td>
          </tr>

          <!-- Letter body -->
          <tr>
            <td style="background-color: #FFFCF9; border-radius: 4px; padding: 48px 44px 52px; border: 1px solid rgba(183,168,201,0.2);">

              <!-- Greeting -->
              <p style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 300; color: #2B2433; line-height: 1.5; margin: 0 0 32px;">
                ${greeting}
              </p>

              <!-- Body paragraphs -->
              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                Thank you for joining Periwink. I wanted to reach out personally, because this community matters to me in a way that goes beyond the professional.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                I&rsquo;m a clinical psychologist, and I&rsquo;ve spent over 20 years helping people navigate emotional change, relationships, and the deeper patterns that shape how we live. But Periwink didn&rsquo;t come from my clinical work alone.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                It came from a personal recognition &mdash; that many women move through this phase of life feeling confused, unsupported, or alone in experiences that are actually deeply shared.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                What&rsquo;s happening during this time is often spoken about narrowly &mdash; reduced to symptoms or kept quietly to ourselves. But for many women, the changes reach far beyond the physical. They affect how we feel, how we relate, how we see ourselves, and how we move through the world.
              </p>

              <!-- Pulled-out line -->
              <p style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 300; font-style: italic; color: #7B6490; line-height: 1.6; margin: 36px 0; padding: 0 0 0 20px; border-left: 2px solid rgba(183,168,201,0.5);">
                My hope for Periwink is that this becomes something different.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                A place where women can learn from one another, share openly, explore what helps, and feel supported as they navigate this evolving chapter of life &mdash; without shame, pressure, or the expectation that there is one &ldquo;right&rdquo; way through.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                There is no one-size-fits-all approach recognized here.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                Some women feel empowered by medical and hormonal interventions. Others lean toward lifestyle, psychological, relational, nutritional, spiritual, or integrative approaches. Most are simply trying to better understand themselves and feel more supported in the process.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                At Periwink, all respectful perspectives are welcome.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 24px;">
                Above all, I hope this becomes a space where women help women &mdash; where honest conversations replace silence, and where what once felt isolating becomes more understandable, connected, and shared.
              </p>

              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 300; color: #3A3142; line-height: 1.9; margin: 0 0 40px;">
                I&rsquo;m glad you&rsquo;re here. And I mean that.
              </p>

              <!-- Sign-off -->
              <div style="border-top: 1px solid rgba(183,168,201,0.25); padding-top: 28px;">
                <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 15px; font-weight: 300; color: #6B6575; line-height: 1.7; margin: 0 0 6px;">
                  Warmly,
                </p>
                <p style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; font-weight: 400; color: #2B2433; margin: 0 0 4px; line-height: 1.4;">
                  Dr. Adrian Tubero, Psy.D.
                </p>
                <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 13px; font-weight: 300; color: #9B8FAA; margin: 0;">
                  Founder, Periwink
                </p>
              </div>

            </td>
          </tr>

          <!-- Closing tagline -->
          <tr>
            <td align="center" style="padding-top: 36px; padding-bottom: 8px;">
              <p style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; font-weight: 300; font-style: italic; color: #B0A3BC; margin: 0; letter-spacing: 0.3px;">
                A wiser way forward &mdash; together.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 12px;">
              <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 300; color: #C4BAD0; margin: 0; line-height: 1.7;">
                &copy; ${new Date().getFullYear()} Periwink &nbsp;&middot;&nbsp;
                <a href="https://www.yourperiwink.com" style="color: #C4BAD0; text-decoration: none;">yourperiwink.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send founder's note:", error);
    return { success: false, error };
  }
}

export async function sendPasswordReset({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL || "https://periwink-hvwa5fgo5q-ue.a.run.app";
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your password — Periwink",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F7F3EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 520px; margin: 0 auto; padding: 48px 24px;">
            <div style="text-align: center; margin-bottom: 36px;">
              <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 300; color: #6E5A7E; margin: 0; letter-spacing: 0.5px;">periwink</h1>
            </div>
            <div style="background: #FDFBF8; border-radius: 20px; padding: 36px 32px; border: 1px solid #E8E3EA;">
              <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 12px;">
                We received a request to reset your Periwink password.
              </p>
              <p style="font-size: 15px; color: #6B6575; line-height: 1.7; margin: 0 0 28px;">
                Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #6E5A7E; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-family: -apple-system, sans-serif;">
                  Reset my password
                </a>
              </div>
              <p style="font-size: 13px; color: #9B94A3; line-height: 1.6; margin: 0;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9B94A3; margin-top: 32px;">
              © ${new Date().getFullYear()} Periwink
            </p>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}

export async function sendAdminNewAccountAlert({
  email,
  displayName,
  userId,
}: {
  email: string;
  displayName?: string | null;
  userId: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: "adrian@yourperiwink.com",
      subject: "New account created — " + (displayName || email),
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #6E5A7E; font-size: 20px; margin-bottom: 16px;">New Account Created</h2>
          ${displayName ? `<p><strong>Name:</strong> ${displayName}</p>` : ""}
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p style="color: #9B94A3; font-size: 13px; margin-top: 16px;">
            ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send admin new account alert:", error);
    return { success: false, error };
  }
}

export async function sendModerationAlert({
  postId,
  postTitle,
  postBody,
  authorName,
  roomName,
  reason,
  severity,
}: {
  postId: string;
  postTitle: string;
  postBody: string;
  authorName: string;
  roomName: string;
  reason: string;
  severity: string;
}) {
  const adminUrl = `${process.env.NEXTAUTH_URL || "https://periwink-hvwa5fgo5q-ue.a.run.app"}/admin`;
  const severityColor = severity === "HIGH" ? "#C62828" : severity === "MEDIUM" ? "#F57F17" : "#1565C0";
  const severityBg = severity === "HIGH" ? "#FFEBEE" : severity === "MEDIUM" ? "#FFF8E1" : "#E3F2FD";

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: "adrian@yourperiwink.com",
      subject: `[${severity}] Content flagged for review — Periwink`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background-color: #F7F3EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 580px; margin: 0 auto; padding: 48px 24px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 300; color: #6E5A7E; margin: 0;">periwink</h1>
              <p style="font-size: 12px; color: #9B94A3; margin: 4px 0 0;">Community moderation alert</p>
            </div>
            <div style="background: #FDFBF8; border-radius: 16px; padding: 28px 28px; border: 1px solid #E8E3EA;">
              <div style="display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: ${severityBg}; color: ${severityColor}; margin-bottom: 16px;">
                ${severity} severity
              </div>
              <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; color: #2B2433; margin: 0 0 8px;">${postTitle}</h2>
              <p style="font-size: 13px; color: #9B94A3; margin: 0 0 16px;">by ${authorName} · in ${roomName}</p>
              <div style="background: #F7F3EE; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="font-size: 14px; color: #6B6575; line-height: 1.6; margin: 0; white-space: pre-wrap;">${postBody.slice(0, 400)}${postBody.length > 400 ? "..." : ""}</p>
              </div>
              <div style="border-left: 3px solid ${severityColor}; padding-left: 14px; margin-bottom: 24px;">
                <p style="font-size: 13px; font-weight: 600; color: #2B2433; margin: 0 0 4px;">AI moderation note</p>
                <p style="font-size: 13px; color: #6B6575; line-height: 1.6; margin: 0;">${reason}</p>
              </div>
              <a href="${adminUrl}?tab=flags" style="display: inline-block; background: #6E5A7E; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px;">
                Review in Admin
              </a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9B94A3; margin-top: 24px;">Post ID: ${postId}</p>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send moderation alert:", error);
    return { success: false, error };
  }
}

export async function sendFoundingMemberConfirmation({
    to,
    name,
    roleType,
}: {
    to: string;
    name: string;
    roleType: string;
}) {
    const roleLabels: Record<string, string> = {
          PRACTITIONER: "Healthcare Practitioner",
          RESEARCHER: "Researcher",
          BRAND_PARTNER: "Brand Partner",
          CONTENT_CREATOR: "Content Creator",
          COMMUNITY_BUILDER: "Community Builder",
    };

  try {
        await getResend().emails.send({
                from: FROM_EMAIL,
                to,
                subject: "Your Founding Member Application — Periwink",
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #F7F3EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <div style="max-width: 520px; margin: 0 auto; padding: 48px 24px;">
                          <div style="text-align: center; margin-bottom: 36px;">
                                <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 300; color: #6E5A7E; margin: 0; letter-spacing: 0.5px;">periwink</h1>
                                    </div>

                                            <div style="background: #FDFBF8; border-radius: 20px; padding: 36px 32px; border: 1px solid #E8E3EA;">
                                                  <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                          Dear ${name},
                                                                </p>

                                                                            <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                                                    Thank you for applying to become a Founding Member of Periwink as a <strong style="color: #6E5A7E;">${roleLabels[roleType] || roleType}</strong>.
                                                                                          </p>

                                                                                                      <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                                                                              We've received your application and are grateful for your interest in helping build this space. We're carefully reviewing each application to ensure alignment with our philosophy — one rooted in relational care, not intervention.
                                                                                                                    </p>
                                                                                                                          
                                                                                                                                <p style="font-size: 16px; color: #2B2433; line-height: 1.7; margin: 0 0 20px;">
                                                                                                                                        We'll be in touch within the next two weeks to share next steps.
                                                                                                                                              </p>
                                                                                                                                                    
                                                                                                                                                          <p style="font-size: 16px; color: #6B6575; line-height: 1.7; margin: 24px 0 0; font-style: italic;">
                                                                                                                                                                  With warmth,<br>
                                                                                                                                                                          The Periwink Team
                                                                                                                                                                                </p>
                                                                                                                                                                                    </div>
                                                                                                                                                                                        
                                                                                                                                                                                            <p style="text-align: center; font-size: 12px; color: #9B94A3; margin-top: 32px;">
                                                                                                                                                                                                  © ${new Date().getFullYear()} Periwink · You're receiving this because you applied at yourperiwink.com
                                                                                                                                                                                                      </p>
                                                                                                                                                                                                        </div>
                                                                                                                                                                                                        </body>
                                                                                                                                                                                                        </html>
                                                                                                                                                                                                              `,
        });
        return { success: true };
  } catch (error) {
        console.error("Failed to send founding member confirmation:", error);
        return { success: false, error };
  }
}
