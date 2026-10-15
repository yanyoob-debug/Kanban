import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

export async function askCredential(label, { hidden = false } = {}) {
  if (!process.stdin.isTTY) {
    throw new Error('Use um terminal interativo ou configure DB_USER e DB_PASSWORD. O F5 também solicita as credenciais.');
  }
  const mutedOutput = hidden ? new Writable({ write(_chunk, _encoding, callback) { callback(); } }) : null;
  const reader = createInterface({ input: process.stdin, output: mutedOutput ?? process.stdout, terminal: true, historySize: 0 });
  reader.on('SIGINT', () => { reader.close(); process.stdout.write('\nInicialização cancelada.\n'); process.exit(130); });
  try {
    if (hidden) process.stdout.write(label);
    return await reader.question(hidden ? '' : label);
  } finally {
    reader.close();
    if (hidden) { process.stdout.write('\n'); mutedOutput.end(); }
  }
}
