import { expect, jest, test } from '@jest/globals';

import { LocalClient, SystemConfig, SystemStatusResponse } from '../../src/client';
import { SystemType } from '../../src/systems/base/types';

const systemConfig = {
  globals: {
    meteo: {
      twilight: { format: 'float[0.00,100000.00](lx)' },
      humidity: { format: 'float[0.00,100.00](%)' },
      brightness: { format: 'float[0.00,100000.00](kLx)' },
      brightnessw: { format: 'float[0.00,100000.00](kLx)' },
      brightnesso: { format: 'float[0.00,100000.00](kLx)' },
      wind: { format: 'float[0.00,100000.00](m/s)' },
      temperature: { format: 'float[-100.00,100.00](°C)' },
      rain: { format: 'float[0.00,100.00](l/h)' },
    },
  },
};

const status = {
  twilight: { value: '120.00' },
  humidity: { value: '55.00' },
  brightness: { value: '1.50' },
  brightnessw: { value: '2.50' },
  brightnesso: { value: '3.50' },
  wind: { value: '4.20' },
  temperature: { value: '-2.30' },
  rain: { value: '0.00' },
} as unknown as SystemStatusResponse;

/**
 * Creates a local client with a stubbed system configuration and status.
 * @param config - The system configuration.
 */
function createClient(config: SystemConfig): LocalClient {
  const client = new LocalClient({ ip: '127.0.0.1', username: 'test', password: 'test' });
  jest.spyOn(client, 'systemConfig', 'get').mockReturnValue(config);
  jest.spyOn(client, 'systemStatusRequest').mockResolvedValue(status);
  return client;
}

test('getItem requests the meteo status', async () => {
  const client = createClient(systemConfig as unknown as SystemConfig);

  await expect(client.weather.getItem()).resolves.toMatchObject({
    twilight: 120,
    humidity: 55,
    brightness: 1.5,
    brightnessWest: 2.5,
    brightnessEast: 3.5,
    wind: 4.2,
    temperature: -2.3,
    rain: 0,
  });
  expect(client.systemStatusRequest).toHaveBeenCalledWith(SystemType.weather);
});
