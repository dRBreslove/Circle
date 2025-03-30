import axios from 'axios';

class ExchangeRateService {
  constructor() {
    this.cache = {
      rates: {},
      lastUpdated: null,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    };
  }

  async getRate(currency) {
    try {
      // Check if we have a valid cached rate
      if (this.isCacheValid(currency)) {
        return this.cache.rates[currency];
      }

      // Fetch rate from multiple sources for reliability
      const rates = await Promise.all([
        this.fetchBinanceRate(currency),
        this.fetchCoinbaseRate(currency),
        this.fetchKrakenRate(currency),
      ]);

      // Calculate average rate
      const validRates = rates.filter(rate => rate !== null);
      const averageRate = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;

      // Update cache
      this.cache.rates[currency] = averageRate;
      this.cache.lastUpdated = Date.now();

      return averageRate;
    } catch (error) {
      console.error(`Error fetching ${currency}/USD rate:`, error);
      // Return cached rate if available, otherwise throw error
      if (this.cache.rates[currency]) {
        return this.cache.rates[currency];
      }
      throw error;
    }
  }

  async fetchBinanceRate(currency) {
    try {
      const symbol = currency === 'BTC' ? 'BTCUSDT' : `${currency}USDT`;
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`Error fetching Binance rate for ${currency}:`, error);
      return null;
    }
  }

  async fetchCoinbaseRate(currency) {
    try {
      const response = await axios.get(`https://api.coinbase.com/v2/prices/${currency}-USD/spot`);
      return parseFloat(response.data.data.amount);
    } catch (error) {
      console.error(`Error fetching Coinbase rate for ${currency}:`, error);
      return null;
    }
  }

  async fetchKrakenRate(currency) {
    try {
      const pair = currency === 'BTC' ? 'XBTUSD' : `${currency}USD`;
      const response = await axios.get(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
      const data = response.data.result[Object.keys(response.data.result)[0]];
      return parseFloat(data.c[0]);
    } catch (error) {
      console.error(`Error fetching Kraken rate for ${currency}:`, error);
      return null;
    }
  }

  isCacheValid(currency) {
    return (
      this.cache.rates[currency] !== undefined &&
      this.cache.lastUpdated !== null &&
      Date.now() - this.cache.lastUpdated < this.cache.cacheDuration
    );
  }

  convertUsdToCrypto(usdAmount, currency, decimals) {
    const rate = this.cache.rates[currency];
    if (!rate) {
      throw new Error(`No exchange rate available for ${currency}`);
    }
    const amount = (usdAmount / rate) * Math.pow(10, decimals);
    return Math.round(amount);
  }

  // Get all supported currencies and their current rates
  async getAllRates() {
    const currencies = ['BTC', 'ETH', 'SOL', 'USDC'];
    const rates = {};
    
    for (const currency of currencies) {
      rates[currency] = await this.getRate(currency);
    }
    
    return rates;
  }

  // Get historical rates for a currency
  async getHistoricalRates(currency, days = 7) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${currency.toLowerCase()}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days,
          },
        }
      );
      
      return response.data.prices.map(([timestamp, price]) => ({
        timestamp: new Date(timestamp),
        price,
      }));
    } catch (error) {
      console.error(`Error fetching historical rates for ${currency}:`, error);
      return null;
    }
  }
}

export default new ExchangeRateService(); 