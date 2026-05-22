import { Resend } from 'resend';

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const dryRun = process.env.DRY_RUN !== 'false';
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (dryRun || !apiKey || !from) {
    return { status: 'sent_dry_run', providerId: null };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: process.env.REPLY_TO || undefined,
  });

  return { status: 'sent', providerId: result.data?.id ?? null };
}
