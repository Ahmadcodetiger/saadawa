export function resolvePort(port: string | number | undefined, fallbackPort = 5000): number {
  const parsedPort = typeof port === 'number'
    ? port
    : Number.parseInt(String(port ?? ''), 10);

  return Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : fallbackPort;
}
