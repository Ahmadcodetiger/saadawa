// services/superjara.service.ts
import axios, { AxiosInstance } from 'axios';
import ProviderConfig from '../models/provider.model.js';
import logger from '../utils/logger.js';

interface SuperJaraVendPayload {
  product_code: string; // e.g., 'mtn_sme_1gb' or airtime codes per SuperJara docs
  phone_number: string;
  amount?: number | string;
  bypass_network?: 'yes' | 'no';
  action: 'vend' | 'status';
  user_reference: string; // unique ref
}

class SuperJaraService {
  private api: AxiosInstance | null = null;

  private async ensureClient(): Promise<AxiosInstance> {
    if (this.api) return this.api;

    // Load from ProviderConfig so admin can manage credentials at runtime
    const cfg = await ProviderConfig.findOne({ code: 'superjara' });
    const baseURL = cfg?.base_url || process.env.SUPERJARA_BASE_URL || 'https://superjara.com';
    const apiKey = cfg?.api_key || (cfg?.metadata as any)?.env?.SUPERJARA_API_KEY || process.env.SUPERJARA_API_KEY || '';

    if (!apiKey) {
      throw new Error('SuperJara API key not configured');
    }

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        // The snippet provided shows header key 'Bearer': 'API_KEY'. If SuperJara expects Authorization header, adjust here.
        Bearer: apiKey,
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        logger.info(`SuperJara API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('SuperJara API Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        logger.info(`SuperJara API Response: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error('SuperJara API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return this.api;
  }

  // Normalize to internal network ids if needed externally via controller mapping
  private buildReference(prefix: string) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
  }

  async purchaseAirtime(data: { network: string; amount: string | number; phone: string; ref?: string; product_code?: string; bypass_network?: boolean }) {
    const api = await this.ensureClient();

    // SuperJara uses a product_code even for airtime (assumption). If they use a generic airtime endpoint/code, map here.
    // Prefer an explicit product_code provided by caller; else derive from network and amount if SuperJara supports dynamic airtime.
    const product_code = data.product_code || `airtime_${data.network.toLowerCase()}`;
    const user_reference = data.ref || this.buildReference('AIRTIME');

    const payload: SuperJaraVendPayload = {
      product_code,
      phone_number: data.phone,
      amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      bypass_network: data.bypass_network ? 'yes' : undefined,
      action: 'vend',
      user_reference,
    };

    const res = await api.post('/autobiz_vending_index.php', payload);
    return res.data;
  }

  async purchaseData(data: { network: string; data_plan: string; phone: string; ref?: string; product_code?: string; bypass_network?: boolean }) {
    const api = await this.ensureClient();

    // Expect controller to pass data_plan as product_code-compliant value (e.g., 'mtn_sme_1gb'). If not, map network+plan here.
    const product_code = data.product_code || data.data_plan; 
    const user_reference = data.ref || this.buildReference('DATA');

    const payload: SuperJaraVendPayload = {
      product_code,
      phone_number: data.phone,
      bypass_network: data.bypass_network ? 'yes' : undefined,
      action: 'vend',
      user_reference,
    };

    const res = await api.post('/autobiz_vending_index.php', payload);
    return res.data;
  }

  async getTransactionStatus(reference: string) {
    const api = await this.ensureClient();
    // If SuperJara supports requery by reference via same endpoint or a different one, adjust accordingly
    // Some providers allow POST with action 'status'. Keeping a simple echo for now if unsupported.
    try {
      const res = await api.post('/autobiz_vending_index.php', {
        action: 'status',
        user_reference: reference,
      });
      return res.data;
    } catch (e) {
      // Fallback: return minimal status
      return { status: 'unknown', reference };
    }
  }

  async getWalletBalance() {
    // If SuperJara exposes a balance endpoint, implement here. Placeholder returns null to avoid breaking admin screens.
    return null as any;
  }
}

export default new SuperJaraService();
