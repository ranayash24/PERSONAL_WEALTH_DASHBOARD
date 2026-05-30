import { PrismaClient, AssetCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing demo user if exists
  await prisma.user.deleteMany({
    where: { email: 'demo@wealthiq.com' },
  })

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo1234!', 12)

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@wealthiq.com',
      password: hashedPassword,
    },
  })

  console.log(`✅ Created demo user: ${user.email}`)

  // Create user settings
  await prisma.userSettings.create({
    data: {
      userId: user.id,
      currency: 'USD',
      alertThreshold: 10.0,
    },
  })

  // Define seed assets
  const assets = [
    {
      name: 'Apple Inc.',
      category: AssetCategory.STOCKS,
      currentValue: 42500,
      purchasePrice: 28000,
      purchaseDate: new Date('2021-03-15'),
      currency: 'USD',
      quantity: 150,
      ticker: 'AAPL',
      location: 'Fidelity',
      notes: 'Core holding, long-term position',
      valuationHistory: [38000, 40500, 41200],
    },
    {
      name: 'Microsoft Corporation',
      category: AssetCategory.STOCKS,
      currentValue: 35200,
      purchasePrice: 22000,
      purchaseDate: new Date('2020-06-10'),
      currency: 'USD',
      quantity: 80,
      ticker: 'MSFT',
      location: 'Fidelity',
      notes: 'Cloud growth thesis',
      valuationHistory: [28000, 31000, 33500],
    },
    {
      name: 'S&P 500 Index Fund',
      category: AssetCategory.STOCKS,
      currentValue: 95000,
      purchasePrice: 60000,
      purchaseDate: new Date('2019-01-01'),
      currency: 'USD',
      quantity: 250,
      ticker: 'VOO',
      location: 'Vanguard',
      notes: 'Core index fund allocation',
      valuationHistory: [75000, 82000, 90000],
    },
    {
      name: 'US Treasury 10Y Bond',
      category: AssetCategory.BONDS,
      currentValue: 50000,
      purchasePrice: 50000,
      purchaseDate: new Date('2023-01-15'),
      currency: 'USD',
      quantity: 50,
      ticker: 'TLT',
      location: 'Schwab',
      notes: '4.2% yield, maturity 2033',
      valuationHistory: [50000, 49800, 50100],
    },
    {
      name: 'Primary Residence',
      category: AssetCategory.REAL_ESTATE,
      currentValue: 650000,
      purchasePrice: 480000,
      purchaseDate: new Date('2018-08-20'),
      currency: 'USD',
      quantity: null,
      ticker: null,
      location: 'San Francisco, CA',
      notes: '30-year fixed mortgage at 3.5%, ~$320k remaining',
      valuationHistory: [580000, 610000, 635000],
    },
    {
      name: 'Bitcoin',
      category: AssetCategory.CRYPTO,
      currentValue: 28500,
      purchasePrice: 15000,
      purchaseDate: new Date('2022-11-20'),
      currency: 'USD',
      quantity: 0.5,
      ticker: 'BTC',
      location: 'Ledger Hardware Wallet',
      notes: 'Cold storage, long-term hold',
      valuationHistory: [16000, 22000, 26000],
    },
    {
      name: 'Ethereum',
      category: AssetCategory.CRYPTO,
      currentValue: 8400,
      purchasePrice: 4500,
      purchaseDate: new Date('2023-03-10'),
      currency: 'USD',
      quantity: 3.5,
      ticker: 'ETH',
      location: 'Coinbase',
      notes: 'Staking rewards enabled',
      valuationHistory: [5000, 6500, 7800],
    },
    {
      name: 'High-Yield Savings Account',
      category: AssetCategory.CASH,
      currentValue: 45000,
      purchasePrice: 45000,
      purchaseDate: new Date('2024-01-01'),
      currency: 'USD',
      quantity: null,
      ticker: null,
      location: 'Marcus by Goldman Sachs',
      notes: '5.25% APY, emergency fund + liquidity',
      valuationHistory: [42000, 43500, 44500],
    },
    {
      name: 'Money Market Fund',
      category: AssetCategory.CASH,
      currentValue: 25000,
      purchasePrice: 25000,
      purchaseDate: new Date('2024-06-01'),
      currency: 'USD',
      quantity: null,
      ticker: 'VMFXX',
      location: 'Vanguard',
      notes: '5.3% 7-day SEC yield',
      valuationHistory: [24000, 24500, 25000],
    },
    {
      name: '401(k) — Vanguard Target 2055',
      category: AssetCategory.RETIREMENT,
      currentValue: 125000,
      purchasePrice: 80000,
      purchaseDate: new Date('2016-06-01'),
      currency: 'USD',
      quantity: null,
      ticker: 'VFFVX',
      location: 'Vanguard 401(k)',
      notes: 'Max contribution each year, employer matches 4%',
      valuationHistory: [105000, 112000, 120000],
    },
    {
      name: 'Gold ETF',
      category: AssetCategory.COMMODITIES,
      currentValue: 12000,
      purchasePrice: 10000,
      purchaseDate: new Date('2023-07-01'),
      currency: 'USD',
      quantity: 45,
      ticker: 'GLD',
      location: 'TD Ameritrade',
      notes: 'Inflation hedge, ~5% of portfolio target',
      valuationHistory: [10500, 11000, 11500],
    },
    {
      name: 'Rental Property — Austin TX',
      category: AssetCategory.REAL_ESTATE,
      currentValue: 385000,
      purchasePrice: 290000,
      purchaseDate: new Date('2020-04-15'),
      currency: 'USD',
      quantity: null,
      ticker: null,
      location: 'Austin, TX',
      notes: 'Generating $2,400/mo gross rental income',
      valuationHistory: [320000, 350000, 370000],
    },
    {
      name: 'Angel Investment — Series A',
      category: AssetCategory.PRIVATE_EQUITY,
      currentValue: 50000,
      purchasePrice: 25000,
      purchaseDate: new Date('2022-05-01'),
      currency: 'USD',
      quantity: null,
      ticker: null,
      location: 'Direct Investment',
      notes: 'Fintech startup, 2% equity stake',
      valuationHistory: [25000, 35000, 45000],
    },
    {
      name: 'Fine Art — Collection',
      category: AssetCategory.ALTERNATIVE,
      currentValue: 18000,
      purchasePrice: 12000,
      purchaseDate: new Date('2021-09-01'),
      currency: 'USD',
      quantity: null,
      ticker: null,
      location: 'Personal — Insured',
      notes: 'Three pieces, appraised annually',
      valuationHistory: [12000, 14000, 16500],
    },
    {
      name: 'Roth IRA — FXAIX',
      category: AssetCategory.RETIREMENT,
      currentValue: 42000,
      purchasePrice: 30000,
      purchaseDate: new Date('2020-01-01'),
      currency: 'USD',
      quantity: null,
      ticker: 'FXAIX',
      location: 'Fidelity Roth IRA',
      notes: 'S&P 500 index, maxing annual contributions',
      valuationHistory: [34000, 37000, 40000],
    },
  ]

  // Create assets with valuation history
  for (const assetData of assets) {
    const { valuationHistory, ...assetFields } = assetData

    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        ...assetFields,
      },
    })

    // Create historical valuations (going back ~3 months)
    const now = new Date()
    for (let i = valuationHistory.length; i > 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)

      await prisma.valuation.create({
        data: {
          assetId: asset.id,
          value: valuationHistory[valuationHistory.length - i],
          date,
          source: 'seed',
        },
      })
    }

    // Create current valuation
    await prisma.valuation.create({
      data: {
        assetId: asset.id,
        value: assetFields.currentValue,
        date: now,
        source: 'seed',
      },
    })
  }

  const totalNetWorth = assets.reduce((sum, a) => sum + a.currentValue, 0)

  console.log(`✅ Created ${assets.length} sample assets`)
  console.log(`💰 Demo portfolio net worth: $${totalNetWorth.toLocaleString()}`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Demo credentials:')
  console.log('  Email:    demo@wealthiq.com')
  console.log('  Password: Demo1234!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
