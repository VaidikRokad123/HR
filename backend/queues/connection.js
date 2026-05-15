import amqplib from 'amqplib';

let connection = null;
let channel = null;

export async function getChannel() {
  if (channel) return channel;

  connection = await amqplib.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Set prefetch so each consumer handles one message at a time
  await channel.prefetch(1);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[RabbitMQ] Closing connection...');
    await channel.close();
    await connection.close();
  });
  process.on('SIGTERM', async () => {
    console.log('[RabbitMQ] Closing connection...');
    await channel.close();
    await connection.close();
  });

  console.log('[RabbitMQ] Connection established');
  return channel;
}
