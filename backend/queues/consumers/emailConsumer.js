import { getChannel }          from '../connection.js';
import { EMAIL_QUEUES }        from '../setup.js';
import { sendEmail }           from '../../utils/emailUtils.js';
import { buildEmailContent }   from '../../utils/emailTemplates.js';

export async function startEmailConsumer() {
  const ch = await getChannel();

  for (const queueName of Object.values(EMAIL_QUEUES)) {
    ch.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const payload    = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        const { subject, body } = buildEmailContent(routingKey, payload);

        await sendEmail(process.env.HR_EMAIL, subject, body);

        ch.ack(msg);
        console.log(`[EmailConsumer] ✅ Email sent | ${routingKey} | ${payload.emp_code}`);

      } catch (err) {
        console.error(`[EmailConsumer] ❌ Failed:`, err.message);
        ch.nack(msg, false, false);  // → Dead Letter Queue, no requeue
      }
    }, { noAck: false });
  }

  console.log('[EmailConsumer] Listening on all queues ✅');
}
