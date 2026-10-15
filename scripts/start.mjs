import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { askCredential } from './credentials.mjs';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const windows = process.platform === 'win32';
const options = process.argv.slice(2);
if (options.some(option => !['--mysql', '--demo'].includes(option)) || (options.includes('--mysql') && options.includes('--demo'))) {
  console.error('Uso: node scripts/start.mjs [--mysql | --demo]');
  process.exit(1);
}
const demo = options.includes('--demo');
const serverEnv = { ...process.env };
if (!demo) {
  try {
    if (!serverEnv.DB_USER) {
      serverEnv.DB_USER = (await askCredential('Usuário do MySQL: ')).trim();
      if (!serverEnv.DB_USER) throw new Error('Informe o usuário da sua conexão MySQL.');
    }
    if (!Object.hasOwn(serverEnv, 'DB_PASSWORD')) {
      serverEnv.DB_PASSWORD = await askCredential('Senha do MySQL (digitação oculta): ', { hidden: true });
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
console.log(demo ? 'Banco selecionado: H2 (demo).' : 'Banco selecionado: MySQL. Conexão padrão: localhost:3306/kanban.');
const mavenArgs = ['-B', 'spring-boot:run', `-Dspring-boot.run.profiles=${demo ? 'demo' : 'mysql'}`];
const server = windows
  ? spawn('cmd.exe', ['/d', '/s', '/c', 'mvn ' + mavenArgs.join(' ')], { cwd, env: serverEnv, windowsHide: true, stdio: ['inherit', 'pipe', 'pipe'] })
  : spawn('mvn', mavenArgs, { cwd, env: serverEnv, stdio: ['inherit', 'pipe', 'pipe'] });

let opened = false;
let output = '';
server.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  output = (output + chunk.toString()).slice(-8192);
  const ready = output.match(/Tomcat started on port (\d+)/);
  if (opened || !ready) return;
  opened = true;
  const url = `http://localhost:${ready[1]}`;
  console.log(`\nKanban disponível em ${url}\n`);
  const browser = windows
    ? spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process '${url}'`], { windowsHide: true, stdio: 'ignore' })
    : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { stdio: 'ignore' });
  browser.on('error', () => console.error(`Abra o navegador em ${url}`));
});
server.stderr.on('data', chunk => process.stderr.write(chunk));
server.on('error', error => { console.error('Falha ao iniciar Maven:', error.message); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = code ?? 1; });
process.on('SIGINT', () => {
  if (windows && server.pid) {
    const stop = spawn('taskkill', ['/pid', String(server.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
    stop.on('error', () => server.kill());
  } else server.kill('SIGINT');
});
