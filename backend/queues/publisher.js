import { getChannel } from './connection.js';
import { EXCHANGE }   from './setup.js';

/**
 * Publish a message to the hr.notifications exchange.
 * @param {string} routingKey - One of the QUEUES values (e.g. 'birthday.reminder')
 * @param {object} payload    - JSON-serialisable data for the consumers
 */
export async function publish(routingKey, payload) {
  const ch  = await getChannel();
  const msg = Buffer.from(JSON.stringify(payload));

  ch.publish(EXCHANGE, routingKey, msg, {
    persistent:  true,          // survives broker restart
    contentType: 'application/json'
  });

  console.log(`[Publisher] → ${routingKey} | emp: ${payload.emp_code}`);
}
