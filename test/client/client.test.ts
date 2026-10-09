/// TODO: mock a gekko instance?
import { expect, test } from '@jest/globals';
import axios, { AxiosError } from 'axios';

import { CLIENT_ERROR_MESSAGES } from '../../src';
import { LocalClient, RemoteClient } from '../../src/client';

test('remote client', async () => {
  const client = new RemoteClient({
    username: 'test',
    gekkoId: 'test',
    apiKey: 'test',
  });

  /*
      try {
        const blinds = client.blinds.getItems();
        console.error(blinds);
        await client.blinds.setPosition("item0", 75);
      } catch (e) {
        console.log(e);
      }
     */

  await expect(async () => await client.initialize()).rejects.toThrow();
});

test('local client', async () => {
  const client = new LocalClient({
    ip: '127.0.1',
    username: 'test',
    password: 'test',
  });

  /*
      try {
        const blinds = client.blinds.getItems();
        console.error(blinds);
        await client.blinds.setPosition("item0", 75);
      } catch (e) {
        console.log(e);
      }
     */

  await expect(async () => await client.initialize()).rejects.toThrow();
});

test('client uses the given axios instance', async () => {
  const urls: string[] = [];
  const axiosInstance = axios.create({
    adapter: async (config) => {
      urls.push(config.url ?? '');
      return { data: { blinds: {} }, status: 200, statusText: 'OK', headers: {}, config };
    },
  });
  const client = new LocalClient({
    ip: '127.0.0.1',
    username: 'test',
    password: 'test',
    axiosInstance,
  });

  await client.initialize();

  expect(urls).toEqual([
    'http://127.0.0.1/api/v1/var?username=test&password=test',
    'http://127.0.0.1/api/v1/trend?username=test&password=test',
  ]);
  expect(client.systemConfig).toEqual({ blinds: {} });
});

test('client maps errors of the given axios instance', async () => {
  const axiosInstance = axios.create({
    adapter: async (config) => {
      throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, null, {
        data: '',
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      });
    },
  });
  const client = new RemoteClient({
    username: 'test',
    gekkoId: 'test',
    apiKey: 'test',
    axiosInstance,
  });

  await expect(client.initialize()).rejects.toThrow(CLIENT_ERROR_MESSAGES.BAD_LOGIN);
});
