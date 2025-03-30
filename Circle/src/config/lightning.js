import { createLnd } from 'lightning';

// Initialize Lightning Network Daemon (LND) connection
const lnd = createLnd({
  // LND connection details
  socket: process.env.LND_SOCKET || 'localhost:10009',
  cert: process.env.LND_CERT_PATH,
  macaroon: process.env.LND_MACAROON_PATH,
  // Optional: Use a proxy for production
  proxy: process.env.LND_PROXY_URL,
});

export { lnd }; 