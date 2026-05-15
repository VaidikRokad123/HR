import { getChannel }        from '../connection.js';
import { NOTIFICATION_QUEUES } from '../setup.js';
import Notification          from '../../models/NotificationModel.js';
import { buildInAppMessage } from '../../utils/emailTemplates.js';

export async function startNotificationConsumer() {
  const ch = await getChannel();

  for (const queueName of Object.values(NOTIFICATION_QUEUES)) {
    ch.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const payload    = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        const message = buildInAppMessage(routingKey, payload);

        await Notification.create({
          toRole:    'hr',
          toEmpCode: null,
          message,
          isRead:    false,
        });

        ch.ack(msg);
        console.log(`[NotifConsumer] ✅ In-app created | ${routingKey} | ${payload.emp_code}`);

      } catch (err) {
        console.error(`[NotifConsumer] ❌ Failed:`, err.message);
        ch.nack(msg, false, false);  // → Dead Letter Queue
      }
    }, { noAck: false });
  }

  console.log('[NotificationConsumer] Listening on all queues ✅');
}
