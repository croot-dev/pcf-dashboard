import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaPg(url);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.emissionFactor.createMany({
    skipDuplicates: true,
    data: [
      // Scope 2 — 전력
      {
        activityType: '전기',
        scope: '2',
        sourceName: '한국전력',
        region: '한국',
        unit: 'kWh',
        factor: 0.4567,
        methodology: 'GHG Protocol / 한국 전력 배출계수 2023',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
      // Scope 3 — 원소재
      {
        activityType: '원소재',
        scope: '3',
        sourceName: '플라스틱 (일반)',
        region: null,
        unit: 'kg',
        factor: 2.53,
        methodology: 'ecoinvent 3.9',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
      {
        activityType: '원소재',
        scope: '3',
        sourceName: '철강',
        region: null,
        unit: 'kg',
        factor: 1.91,
        methodology: 'ecoinvent 3.9',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
      {
        activityType: '원소재',
        scope: '3',
        sourceName: '알루미늄',
        region: null,
        unit: 'kg',
        factor: 11.89,
        methodology: 'ecoinvent 3.9',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
      // Scope 3 — 운송
      {
        activityType: '운송',
        scope: '3',
        sourceName: '도로 운송 (트럭)',
        region: '한국',
        unit: 'ton-km',
        factor: 0.0671,
        methodology: 'GHG Protocol / IPCC 2006',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
      {
        activityType: '운송',
        scope: '3',
        sourceName: '해상 운송',
        region: null,
        unit: 'ton-km',
        factor: 0.0116,
        methodology: 'GHG Protocol / IPCC 2006',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
      // Scope 1 — 직접 연소
      {
        activityType: '연료연소',
        scope: '1',
        sourceName: '천연가스',
        region: null,
        unit: 'MJ',
        factor: 0.0561,
        methodology: 'IPCC 2006 / GHG Protocol',
        validFrom: new Date('2023-01-01'),
        validTo: null,
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
