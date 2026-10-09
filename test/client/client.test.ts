/// TODO: mock a gekko instance?
import { afterEach, describe, expect, jest, test } from '@jest/globals';
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

describe('auth params', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('local client encodes the credentials', async () => {
    const axiosInstance = axios.create();
    const get = jest.spyOn(axiosInstance, 'get').mockResolvedValue({ data: { blinds: {} } });
    const client = new LocalClient({
      ip: '127.0.0.1',
      username: 'user name&#%?',
      password: 'test',
      axiosInstance,
    });

    await client.initialize();

    const [url, config] = get.mock.calls[0];
    expect(url).toBe('http://127.0.0.1/api/v1/var');
    expect(axios.getUri({ url, params: config?.params })).toBe(
      'http://127.0.0.1/api/v1/var?username=user+name%26%23%25%3F&password=test'
    );
  });

  test('remote client encodes the credentials', async () => {
    const axiosInstance = axios.create();
    const get = jest.spyOn(axiosInstance, 'get').mockResolvedValue({ data: { blinds: {} } });
    const client = new RemoteClient({
      username: 'user@example.com',
      gekkoId: 'K999-AAAA-BBBB',
      apiKey: 'a&b=c',
      axiosInstance,
    });

    await client.initialize();
    await client.request('/var/blinds/item0/scmd/set?value=1&');

    const [, , [url, config]] = get.mock.calls;
    expect(axios.getUri({ url, params: config?.params })).toBe(
      'https://live.my-gekko.com/api/v1/var/blinds/item0/scmd/set?value=1&username=user%40example.com&key=a%26b%3Dc&gekkoid=K999-AAAA-BBBB'
    );
  });
});

test('client uses the given axios instance', async () => {
  const urls: string[] = [];
  const axiosInstance = axios.create({
    adapter: async (config) => {
      urls.push(axios.getUri(config));
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
