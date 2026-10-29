import { Router, Request, Response } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Luma Backend API',
    version: '1.0.0',
    description:
      'Backend API untuk Luma - Platform Analisis & Visualisasi Multisektoral DKI Jakarta (Pendidikan, Kualitas Air, RTH, Transportasi Umum, Kualitas Udara, dan Fasilitas Kesehatan).',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development Server',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Periksa status kesehatan server dan koneksi database',
        responses: {
          '200': {
            description: 'Status server sehat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', example: 12.34 },
                    timestamp: { type: 'string', example: '2026-10-28T14:00:00.000Z' },
                    database: { type: 'string', example: 'connected' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/facilities': {
      get: {
        tags: ['Facilities'],
        summary: 'Daftar fasilitas publik dengan filter spasial & paginasi',
        parameters: [
          {
            name: 'wilayah',
            in: 'query',
            description: 'Filter kota administrasi (contoh: JAKARTA SELATAN, ALL)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter kategori (fasum, transport, kesehatan, pendidikan)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Pencarian nama fasilitas',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Halaman data (default: 1)',
            required: false,
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Jumlah data per halaman (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar fasilitas berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Facility' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/facilities/{id}': {
      get: {
        tags: ['Facilities'],
        summary: 'Detail relasional lengkap fasilitas berdasarkan UUID atau slug',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID atau slug fasilitas (contoh: 11b4c2c8-e7b9-4faf-98f6-1f88b6427f6c atau rth-tebet-ecopark)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Detail fasilitas ditemukan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { $ref: '#/components/schemas/FacilityDetail' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Fasilitas tidak ditemukan',
          },
        },
      },
    },
    '/api/v1/indicators': {
      get: {
        tags: ['Indicators'],
        summary: 'Metrik agregasi 6 indikator sektoral DKI Jakarta',
        parameters: [
          {
            name: 'wilayah',
            in: 'query',
            description: 'Kode wilayah (ALL, JAKARTA BARAT, JAKARTA PUSAT, dll)',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Indikator wilayah berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/visualizations/overview': {
      get: {
        tags: ['Visualizations'],
        summary: 'Ringkasan metrik global dan matriks volume dataset lintas sektor',
        responses: {
          '200': {
            description: 'Data overview visualisasi berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        generatedAt: { type: 'string', example: '2026-10-24' },
                        kpis: { type: 'object' },
                        charts: { type: 'object' },
                        overview: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/visualizations/sectors/{sector}': {
      get: {
        tags: ['Visualizations'],
        summary: 'Statistik analitik dan grafik spesifik per sektor',
        parameters: [
          {
            name: 'sector',
            in: 'path',
            required: true,
            description: 'Nama sektor: air, rth, sekolah, transum, udara, kesehatan',
            schema: {
              type: 'string',
              enum: ['air', 'rth', 'sekolah', 'transum', 'udara', 'kesehatan'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Data statistik sektor berhasil diambil',
          },
          '400': {
            description: 'Sektor tidak valid',
          },
        },
      },
    },
    '/api/v1/visualizations/catalog': {
      get: {
        tags: ['Visualizations'],
        summary: 'Katalog paket dataset normalisasi DKI Jakarta',
        responses: {
          '200': {
            description: 'Daftar katalog paket data',
          },
        },
      },
    },
    '/api/v1/dataset/summary': {
      get: {
        tags: ['Dataset (Legacy)'],
        summary: 'Katalog dataset dan KPI ringkasan (kompatibilitas mundur)',
        responses: { '200': { description: 'Berhasil' } },
      },
    },
    '/api/v1/dataset/wilayah': {
      get: {
        tags: ['Dataset (Legacy)'],
        summary: 'Agregasi dataset per wilayah administrasi (kompatibilitas mundur)',
        responses: { '200': { description: 'Berhasil' } },
      },
    },
  },
  components: {
    schemas: {
      Facility: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '11b4c2c8-e7b9-4faf-98f6-1f88b6427f6c' },
          slug: { type: 'string', example: 'rth-tebet-ecopark' },
          name: { type: 'string', example: 'Tebet Eco Park' },
          category: { type: 'string', example: 'fasum' },
          subCategory: { type: 'string', example: 'Taman Publik & RTH' },
          wilayah: { type: 'string', example: 'JAKARTA SELATAN' },
          kecamatan: { type: 'string', example: 'TEBET' },
          address: { type: 'string' },
          lat: { type: 'number', example: -6.2366 },
          lng: { type: 'number', example: 106.8532 },
        },
      },
      FacilityDetail: {
        allOf: [
          { $ref: '#/components/schemas/Facility' },
          {
            type: 'object',
            properties: {
              budget: {
                type: 'object',
                properties: {
                  total: { type: 'string', example: 'Rp 49.300.000.000' },
                  source: { type: 'string', example: 'KLB' },
                  year: { type: 'string', example: '2021 - 2022' },
                  contractor: { type: 'string' },
                  status: { type: 'string' },
                },
              },
              metrics: {
                type: 'object',
                properties: {
                  aqi: { type: 'integer', example: 64 },
                  aqiStatus: { type: 'string', example: 'Sedang' },
                  pm25: { type: 'string', example: '18.2 µg/m³' },
                  walkability: { type: 'string', example: '4.8 / 5.0' },
                  transitAccess: { type: 'string' },
                },
              },
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    size: { type: 'string' },
                    dept: { type: 'string' },
                    fileUrl: { type: 'string', nullable: true },
                  },
                },
              },
              specs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    specKey: { type: 'string' },
                    specValue: { type: 'string' },
                  },
                },
              },
            },
          },
        ],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 34 },
          totalPages: { type: 'integer', example: 4 },
        },
      },
    },
  },
};

/**
 * GET /api/docs/openapi.json
 * Mengembalikan OpenAPI specification dalam format JSON
 */
router.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openApiSpec);
});

/**
 * GET /api/docs
 * Tampilan interaktif Swagger UI via CDN resmi Swagger UI
 */
router.get('/api/docs', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Luma Backend API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
});

export default router;
