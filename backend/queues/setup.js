import { getChannel } from './connection.js';

export const EXCHANGE = 'hr.notifications';
export const DLX      = 'hr.notifications.dlx';
export const DLQ      = 'hr.notifications.dead';

export const QUEUES = {
  BIRTHDAY:    'birthday.reminder',
  PROBATION:   'probation.ending',
  ANNIVERSARY: 'work.anniversary',
  PROFILE:     'profile.incomplete',
  PAYROLL:     'payroll.pending',
};

export const EMAIL_QUEUES = Object.fromEntries(
  Object.entries(QUEUES).map(([key, routingKey]) => [key, `${routingKey}.email`])
);

export const NOTIFICATION_QUEUES = Object.fromEntries(
  Object.entries(QUEUES).map(([key, routingKey]) => [key, `${routingKey}.notification`])
);

export async function setupRabbitMQ() {
  const ch = await getChannel();

  // Main direct exchange
  await ch.assertExchange(EXCHANGE, 'direct', { durable: true });

  // Dead-letter exchange + queue for failed messages
  await ch.assertExchange(DLX, 'fanout', { durable: true });
  await ch.assertQueue(DLQ, { durable: true });
  await ch.bindQueue(DLQ, DLX, '');

  // Email and in-app notifications need separate queues. If both consumers
  // share one queue, RabbitMQ will deliver each message to only one of them.
  for (const [key, routingKey] of Object.entries(QUEUES)) {
    for (const queueName of [EMAIL_QUEUES[key], NOTIFICATION_QUEUES[key]]) {
      await ch.assertQueue(queueName, {
        durable: true,
        arguments: { 'x-dead-letter-exchange': DLX }
      });
      await ch.bindQueue(queueName, EXCHANGE, routingKey);
    }
  }

  console.log('[RabbitMQ] Exchange + queues ready ✅');
}
