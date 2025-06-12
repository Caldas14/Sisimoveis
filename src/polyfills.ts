// Polyfills para APIs do Node.js no navegador
import { Buffer } from 'buffer';

// Definir Buffer globalmente
window.Buffer = Buffer;
window.global = window;

// Definir process.env para evitar erros
if (!window.process) {
  window.process = { env: {} } as any;
}

// Exportar para garantir que este arquivo seja incluído no bundle
export default {};
