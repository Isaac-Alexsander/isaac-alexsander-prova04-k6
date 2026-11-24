import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getItemsDuration = new Trend('get_items', true);
export const getItemByIdDuration = new Trend('get_item_by_id', true);
export const postItemDuration = new Trend('post_item', true);
export const putItemDuration = new Trend('put_item', true);
export const RateContentOK = new Rate('content_OK');

// Rampa: inicia com 7 VUs, pico de 92 VUs, total de 210s (3,5 minutos)
// 30s + 45s + 45s + 60s + 30s = 210s
export const options = {
  vus: 7, // com stages no topo, "vus" define os VUs iniciais (startVUs da rampa)
  stages: [
    { duration: '30s', target: 30 },
    { duration: '45s', target: 60 },
    { duration: '45s', target: 92 },
    { duration: '60s', target: 92 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(90)<6800'],
    http_req_failed: ['rate<0.25']
  }
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

const BASE_URL =
  __ENV.BASE_URL || 'https://api-prova02-isaacalexsander.onrender.com';

const params = {
  headers: {
    'Content-Type': 'application/json'
  }
};

const OK = 200;
const CREATED = 201;
const SEED_ITEMS = 20;

export default function () {
  group('GET /items', () => {
    const skip = Math.floor(Math.random() * SEED_ITEMS);
    const res = http.get(`${BASE_URL}/items?limit=5&skip=${skip}`, params);

    getItemsDuration.add(res.timings.duration);
    RateContentOK.add(res.status === OK);

    check(res, {
      'GET Items - Status 200': () => res.status === OK,
      'GET Items - Retorna lista de itens': () =>
        res.status === OK && Array.isArray(res.json('items'))
    });
  });

  group('GET /items/:id', () => {
    const id = Math.floor(Math.random() * SEED_ITEMS) + 1;
    const res = http.get(`${BASE_URL}/items/${id}`, params);

    getItemByIdDuration.add(res.timings.duration);
    RateContentOK.add(res.status === OK);

    check(res, {
      'GET Item por ID - Status 200': () => res.status === OK,
      'GET Item por ID - ID correto': () =>
        res.status === OK && res.json('id') === id
    });
  });

  let createdId;

  group('POST /items', () => {
    const payload = JSON.stringify({
      nome: `Item k6 VU${__VU}-${__ITER}`,
      categoria: 'Performance',
      preco: 99.9,
      quantidade: 10
    });
    const res = http.post(`${BASE_URL}/items`, payload, params);

    postItemDuration.add(res.timings.duration);
    RateContentOK.add(res.status === CREATED);

    check(res, {
      'POST Item - Status 201': () => res.status === CREATED,
      'POST Item - Retorna ID gerado': () =>
        res.status === CREATED && typeof res.json('id') === 'number'
    });

    if (res.status === CREATED) {
      createdId = res.json('id');
    }
  });

  if (createdId !== undefined) {
    group('PUT /items/:id', () => {
      const payload = JSON.stringify({ preco: 149.9, quantidade: 5 });
      const res = http.put(`${BASE_URL}/items/${createdId}`, payload, params);

      putItemDuration.add(res.timings.duration);
      RateContentOK.add(res.status === OK);

      check(res, {
        'PUT Item - Status 200': () => res.status === OK,
        'PUT Item - Preço atualizado': () =>
          res.status === OK && res.json('preco') === 149.9
      });
    });
  }

  sleep(1);
}
