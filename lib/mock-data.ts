export const DEMO_USER_ID = 'demo-user-id'

export const MOCK_USER_SETTINGS = {
  id: 'demo-settings-id',
  userId: DEMO_USER_ID,
  currency: 'USD',
  alertThreshold: 10.0,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

function makeValuations(assetId: string, history: number[]) {
  const now = new Date()
  const valuations = history.map((value, i) => {
    const date = new Date(now)
    date.setMonth(date.getMonth() - (history.length - i))
    return {
      id: `${assetId}-v${i}`,
      assetId,
      value,
      date,
      source: 'seed',
      createdAt: date,
    }
  })
  valuations.push({
    id: `${assetId}-vcurrent`,
    assetId,
    value: history[history.length - 1],
    date: now,
    source: 'seed',
    createdAt: now,
  })
  return valuations
}

const seeds = [
  { id: 'a1',  name: 'Apple Inc.',                category: 'STOCKS',         currentValue: 42500,  purchasePrice: 28000,  purchaseDate: '2021-03-15', quantity: 150,  ticker: 'AAPL',  location: 'Fidelity',                 notes: 'Core holding, long-term position',          history: [38000, 40500, 41200, 42500] },
  { id: 'a2',  name: 'Microsoft Corporation',     category: 'STOCKS',         currentValue: 35200,  purchasePrice: 22000,  purchaseDate: '2020-06-10', quantity: 80,   ticker: 'MSFT',  location: 'Fidelity',                 notes: 'Cloud growth thesis',                       history: [28000, 31000, 33500, 35200] },
  { id: 'a3',  name: 'S&P 500 Index Fund',        category: 'STOCKS',         currentValue: 95000,  purchasePrice: 60000,  purchaseDate: '2019-01-01', quantity: 250,  ticker: 'VOO',   location: 'Vanguard',                 notes: 'Core index fund allocation',                history: [75000, 82000, 90000, 95000] },
  { id: 'a4',  name: 'US Treasury 10Y Bond',      category: 'BONDS',          currentValue: 50000,  purchasePrice: 50000,  purchaseDate: '2023-01-15', quantity: 50,   ticker: 'TLT',   location: 'Schwab',                   notes: '4.2% yield, maturity 2033',                 history: [50000, 49800, 50100, 50000] },
  { id: 'a5',  name: 'Primary Residence',         category: 'REAL_ESTATE',    currentValue: 650000, purchasePrice: 480000, purchaseDate: '2018-08-20', quantity: null, ticker: null,    location: 'San Francisco, CA',        notes: '30-year fixed mortgage at 3.5%',            history: [580000, 610000, 635000, 650000] },
  { id: 'a6',  name: 'Bitcoin',                   category: 'CRYPTO',         currentValue: 28500,  purchasePrice: 15000,  purchaseDate: '2022-11-20', quantity: 0.5,  ticker: 'BTC',   location: 'Ledger Hardware Wallet',   notes: 'Cold storage, long-term hold',              history: [16000, 22000, 26000, 28500] },
  { id: 'a7',  name: 'Ethereum',                  category: 'CRYPTO',         currentValue: 8400,   purchasePrice: 4500,   purchaseDate: '2023-03-10', quantity: 3.5,  ticker: 'ETH',   location: 'Coinbase',                 notes: 'Staking rewards enabled',                   history: [5000, 6500, 7800, 8400] },
  { id: 'a8',  name: 'High-Yield Savings Account',category: 'CASH',           currentValue: 45000,  purchasePrice: 45000,  purchaseDate: '2024-01-01', quantity: null, ticker: null,    location: 'Marcus by Goldman Sachs',  notes: '5.25% APY, emergency fund + liquidity',    history: [42000, 43500, 44500, 45000] },
  { id: 'a9',  name: 'Money Market Fund',         category: 'CASH',           currentValue: 25000,  purchasePrice: 25000,  purchaseDate: '2024-06-01', quantity: null, ticker: 'VMFXX', location: 'Vanguard',                 notes: '5.3% 7-day SEC yield',                      history: [24000, 24500, 25000, 25000] },
  { id: 'a10', name: '401(k) — Vanguard Target 2055', category: 'RETIREMENT', currentValue: 125000, purchasePrice: 80000,  purchaseDate: '2016-06-01', quantity: null, ticker: 'VFFVX', location: 'Vanguard 401(k)',          notes: 'Max contribution, employer matches 4%',     history: [105000, 112000, 120000, 125000] },
  { id: 'a11', name: 'Gold ETF',                  category: 'COMMODITIES',    currentValue: 12000,  purchasePrice: 10000,  purchaseDate: '2023-07-01', quantity: 45,   ticker: 'GLD',   location: 'TD Ameritrade',            notes: 'Inflation hedge, ~5% of portfolio target',  history: [10500, 11000, 11500, 12000] },
  { id: 'a12', name: 'Rental Property — Austin TX', category: 'REAL_ESTATE',  currentValue: 385000, purchasePrice: 290000, purchaseDate: '2020-04-15', quantity: null, ticker: null,    location: 'Austin, TX',               notes: 'Generating $2,400/mo gross rental income',  history: [320000, 350000, 370000, 385000] },
  { id: 'a13', name: 'Angel Investment — Series A', category: 'PRIVATE_EQUITY',currentValue: 50000, purchasePrice: 25000,  purchaseDate: '2022-05-01', quantity: null, ticker: null,    location: 'Direct Investment',        notes: 'Fintech startup, 2% equity stake',          history: [25000, 35000, 45000, 50000] },
  { id: 'a14', name: 'Fine Art — Collection',     category: 'ALTERNATIVE',    currentValue: 18000,  purchasePrice: 12000,  purchaseDate: '2021-09-01', quantity: null, ticker: null,    location: 'Personal — Insured',       notes: 'Three pieces, appraised annually',           history: [12000, 14000, 16500, 18000] },
  { id: 'a15', name: 'Roth IRA — FXAIX',          category: 'RETIREMENT',     currentValue: 42000,  purchasePrice: 30000,  purchaseDate: '2020-01-01', quantity: null, ticker: 'FXAIX', location: 'Fidelity Roth IRA',        notes: 'S&P 500 index, maxing annual contributions',history: [34000, 37000, 40000, 42000] },
]

export const MOCK_ASSETS = seeds.map((s) => ({
  id: s.id,
  userId: DEMO_USER_ID,
  name: s.name,
  category: s.category as any,
  currentValue: s.currentValue,
  purchasePrice: s.purchasePrice,
  purchaseDate: new Date(s.purchaseDate),
  currency: 'USD',
  quantity: s.quantity,
  ticker: s.ticker,
  location: s.location,
  notes: s.notes,
  isEncrypted: false,
  createdAt: new Date(s.purchaseDate),
  updatedAt: new Date('2024-01-01'),
  valuations: makeValuations(s.id, s.history),
}))
