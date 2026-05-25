/** URL do Socket.IO conforme onde o jogador abriu o jogo. */
export function getSocketUrl(): string {
  const explicit = import.meta.env.VITE_SERVER_URL;
  if (explicit) return explicit;

  const { hostname, origin } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocal) {
    return "http://localhost:3001";
  }

  // ngrok / rede externa: mesmo host do cliente (Vite faz proxy de /socket.io -> 3001)
  return origin;
}

export function isNgrokHost(): boolean {
  return /ngrok/i.test(window.location.hostname);
}
