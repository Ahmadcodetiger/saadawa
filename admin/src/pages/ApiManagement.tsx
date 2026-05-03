import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, Check, Copy, Eye, EyeOff, Key, RefreshCw, Save, Search, Shield, ShieldOff, Tag, Terminal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { generateApiKey, getPricingPlans, getUsers, revokeApiKey, updatePricingPlan } from '../api/adminApi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { getApiUrl } from '../config/api.config';
import { useToast } from '../hooks/ToastContext';

const ApiManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'test' | 'pricing'>('keys');
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [testApiKey, setTestApiKey] = useState('');
    const [testPhone, setTestPhone] = useState('');
    const [testAmount, setTestAmount] = useState('');
    const [testNetwork, setTestNetwork] = useState('1');
    const [testPlan, setTestPlan] = useState('');
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
    const [filterType, setFilterType] = useState<'ALL' | 'DATA' | 'AIRTIME'>('ALL');

    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users-api', searchTerm],
        queryFn: () => getUsers({ page: 1, limit: 20, search: searchTerm }).then((res: any) => res.data),
    });

    const { data: plansData, isLoading: isLoadingPlans } = useQuery({
        queryKey: ['pricing-plans'],
        queryFn: () => getPricingPlans({ limit: 1000 }).then((res: any) => res.data),
        enabled: activeTab === 'pricing' || activeTab === 'test',
    });

    const generateMutation = useMutation({
        mutationFn: (userId: string) => generateApiKey(userId).then((res: any) => res.data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users-api'] });
            alert(`API Key Generated: ${data.apiKey}\n\nPlease copy and save it securely. It will not be shown again.`);
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (userId: string) => revokeApiKey(userId).then((res: any) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users-api'] });
        },
    });

    const updatePriceMutation = useMutation({
        mutationFn: ({ id, api_discount }: { id: string; api_discount: number }) => updatePricingPlan(id, { api_discount }).then((res: any) => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
            showSuccess('API discount updated successfully');
        },
        onError: () => {
            showError('Failed to update API discount');
        }
    });

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const toggleReveal = (userId: string) => {
        setRevealedKeys(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const handleTestApi = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTesting(true);
        setTestResult(null);

        if (!testPlan) {
            setTestResult({ success: false, message: 'Please select a data plan' });
            setIsTesting(false);
            return;
        }

        // Map network number to network name
        const networkMap: Record<string, string> = {
            '1': 'mtn',
            '2': 'airtel',
            '3': 'glo',
            '4': '9mobile'
        };

        try {
            const response = await fetch(`${getApiUrl()}/billpayment/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': testApiKey,
                },
                body: JSON.stringify({
                    phone: testPhone,
                    network: networkMap[testNetwork] || 'mtn',
                    plan: testPlan,
                    ported_number: true
                }),
            });
            const data = await response.json();
            setTestResult(data);
        } catch (error: any) {
            setTestResult({ success: false, message: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    const users = usersData?.data || [];
    const plans = plansData?.data?.plans || [];

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar onMenuClick={() => setIsMobileOpen(true)} />
                <main className="flex-1 overflow-auto p-8 scrollbar-hide">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">API Management</h1>
                            <p className="text-slate-600">Manage developer API keys, pricing, and view documentation</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-1 bg-slate-200 p-1 rounded-xl mb-8 w-fit">
                            <button
                                onClick={() => setActiveTab('keys')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'keys' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Key className="w-4 h-4" />
                                API Keys
                            </button>
                            <button
                                onClick={() => setActiveTab('pricing')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'pricing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Tag className="w-4 h-4" />
                                Developer Pricing
                            </button>
                            <button
                                onClick={() => setActiveTab('docs')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'docs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Book className="w-4 h-4" />
                                Documentation
                            </button>
                            <button
                                onClick={() => setActiveTab('test')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all \${activeTab === 'test' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Terminal className="w-4 h-4" />
                                Test API
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            {activeTab === 'keys' && (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-slate-900">User API Keys</h2>
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">API Key</th>
                                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {isLoadingUsers ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center">
                                                            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                                            <p className="text-slate-500">Loading users...</p>
                                                        </td>
                                                    </tr>
                                                ) : users.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                            No users found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    users.map((user: any) => (
                                                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {user.api_key_enabled ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <Shield className="w-3 h-3" />
                                                                        Enabled
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                                        <ShieldOff className="w-3 h-3" />
                                                                        Disabled
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {user.api_key ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-mono">
                                                                            {revealedKeys[user._id]
                                                                                ? user.api_key
                                                                                : `\${user.api_key.substring(0, 8)}****************\${user.api_key.slice(-4)}`}
                                                                        </code>
                                                                        <button
                                                                            onClick={() => toggleReveal(user._id)}
                                                                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                                                            title={revealedKeys[user._id] ? "Hide Key" : "Show Key"}
                                                                        >
                                                                            {revealedKeys[user._id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleCopy(user.api_key)}
                                                                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                                                            title="Copy Key"
                                                                        >
                                                                            {copiedKey === user.api_key ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">No key generated</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {user.api_key ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('Are you sure you want to revoke this API key? The user will no longer be able to use it.')) {
                                                                                revokeMutation.mutate(user._id);
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium ml-auto"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Revoke
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => generateMutation.mutate(user._id)}
                                                                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium ml-auto"
                                                                    >
                                                                        <Key className="w-4 h-4" />
                                                                        Generate Key
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pricing' && (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-slate-900">Developer Pricing Control</h2>
                                            <p className="text-sm text-slate-500">Set custom prices for API consumers</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                value={filterType}
                                                onChange={(e) => setFilterType(e.target.value as any)}
                                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="ALL">All Types</option>
                                                <option value="DATA">Data</option>
                                                <option value="AIRTIME">Airtime</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Plan Name</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Provider</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Regular Price</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Discount (%)</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">API Price</th>
                                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {isLoadingPlans ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center">
                                                            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                                            <p className="text-slate-500">Loading plans...</p>
                                                        </td>
                                                    </tr>
                                                ) : plans.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                            No plans found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    plans
                                                        .filter((plan: any) => filterType === 'ALL' || plan.type === filterType)
                                                        .map((plan: any) => {
                                                            const apiDiscount = editingPrices[plan._id] ?? plan.api_discount ?? 0;
                                                            const apiPrice = plan.price * (1 - apiDiscount / 100);

                                                            return (
                                                                <tr key={plan._id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <p className="font-medium text-slate-900">{plan.name}</p>
                                                                        <p className="text-xs text-slate-500 uppercase">{plan.type}</p>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="text-sm text-slate-600">{plan.providerName || plan.operator_id?.name || 'N/A'}</span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="text-sm font-medium text-slate-900">₦{plan.price}</span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                value={apiDiscount}
                                                                                onChange={(e) => setEditingPrices(prev => ({ ...prev, [plan._id]: parseFloat(e.target.value) }))}
                                                                                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                                                min="0"
                                                                                max="100"
                                                                                step="0.1"
                                                                            />
                                                                            <span className="text-slate-400 text-sm">%</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="text-sm font-bold text-blue-600">₦{apiPrice.toFixed(2)}</span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <button
                                                                            onClick={() => updatePriceMutation.mutate({ id: plan._id, api_discount: apiDiscount })}
                                                                            disabled={updatePriceMutation.isPending}
                                                                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium ml-auto disabled:opacity-50"
                                                                        >
                                                                            <Save className="w-4 h-4" />
                                                                            Save
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'docs' && (
                                <div className="p-8 prose prose-slate max-w-none">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Developer API Documentation</h2>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Authentication</h3>
                                        <p className="text-slate-600 mb-4">
                                            All API requests must include your API key in the <code>x-api-key</code> header.
                                        </p>
                                        <div className="bg-slate-900 rounded-lg p-4 text-slate-100 font-mono text-sm">
                                            x-api-key: sk_live_your_api_key_here
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Base URL</h3>
                                        <div className="bg-slate-900 rounded-lg p-4 text-slate-100 font-mono text-sm">
                                            {getApiUrl()}
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Wallet Balance</h3>
                                        <p className="text-slate-600 mb-4">Check your current wallet balance.</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-700">GET</span>
                                                <span className="text-xs font-mono text-slate-600">/billpayment/balance</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm font-semibold mb-2">Sample Response:</p>
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                    {`{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "balance": 5000.50,
    "currency": "NGN"
  }
}`}
                                                </pre>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Fetch Networks</h3>
                                        <p className="text-slate-600 mb-4">Retrieve available networks.</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-700">GET</span>
                                                <span className="text-xs font-mono text-slate-600">/billpayment/networks</span>
                                            </div>
                                            <div className="p-4">
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                    {`[
  { "id": "1", "name": "MTN" },
  { "id": "2", "name": "AIRTEL" },
  { "id": "3", "name": "GLO" },
  { "id": "4", "name": "9MOBILE" }
]`}
                                                </pre>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Fetch Data Plans</h3>
                                        <p className="text-slate-600 mb-4">Retrieve available data plans. Pass \`network\` query param to filter, or omit it to fetch <strong>all plans at once</strong>.</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-700">GET</span>
                                                <span className="text-xs font-mono text-slate-600">/billpayment/data-plans</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm font-semibold mb-2">Sample Response:</p>
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                    {`[
  {
    "plan_id": "65a...",
    "network": "1",
    "plan_name": "MTN 1GB (SME)",
    "plan_type": "DATA",
    "price": 250,
    "validity": "30 Days",
    "data_value": "1GB"
  },
  {
    "plan_id": "65b...",
    "network": "2",
    "plan_name": "Airtel 1GB",
    ...
  }
]`}
                                                </pre>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Buy Data</h3>
                                        <p className="text-slate-600 mb-4">Purchase data bundles for any network.</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-green-700">POST</span>
                                                <span className="text-xs font-mono text-slate-600">/billpayment/data</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm font-semibold mb-2">Request Body:</p>
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg mb-4">
                                                    {`{
  "phone": "08012345678",
  "network": "mtn",
  "plan": "65a...", // Plan ID from /plans
  "amount": 250,
  "ported_number": true // Optional, default true
}`}
                                                </pre>
                                                <p className="text-sm font-semibold mb-2">Success Response:</p>
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                    {`{
  "success": true,
  "message": "Data purchase successful",
  "data": {
    "transaction": { ... },
    "balance": 4850.00,
    "provider_response": { ... }
  }
}`}
                                                </pre>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Buy Airtime</h3>
                                        <p className="text-slate-600 mb-4">Purchase airtime for any network.</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-green-700">POST</span>
                                                <span className="text-xs font-mono text-slate-600">/billpayment/airtime</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm font-semibold mb-2">Success Response:</p>
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                    {`{
  "success": true,
  "message": "Airtime purchase successful",
  "data": {
    "transaction": { ... },
    "balance": 4900.00,
    "provider_response": { ... }
  }
}`}
                                                </pre>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Transaction Status</h3>
                                        <p className="text-slate-600 mb-4">Check the status of a transaction.</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-700">GET</span>
                                                <span className="text-xs font-mono text-slate-600">/billpayment/transaction/:reference</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm font-semibold mb-2">Sample Response:</p>
                                                <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                    {`{
  "success": true,
  "message": "Transaction status retrieved",
  "data": {
    "status": "successful",
    "amount": 100,
    "reference": "AIRTIME_123..."
  }
}`}
                                                </pre>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Cable TV</h3>
                                        <p className="text-slate-600 mb-4">Verify and purchase Cable TV subscriptions.</p>

                                        <div className="space-y-4">
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-700">GET</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/cable-providers</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-green-700">POST</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/cable/verify</span>
                                                </div>
                                                <div className="p-4">
                                                    <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                        {`{ "provider": "dstv", "iucnumber": "1234567890" }`}
                                                    </pre>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-green-700">POST</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/cable/purchase</span>
                                                </div>
                                                <div className="p-4">
                                                    <p className="text-sm font-semibold mb-2">Success Response:</p>
                                                    <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                        {`{
  "success": true,
  "message": "Cable TV purchase successful",
  "data": {
    "transaction": { ... },
    "balance": 3500.00,
    "provider_response": { ... }
  }
}`}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Electricity</h3>
                                        <p className="text-slate-600 mb-4">Verify and purchase Electricity tokens.</p>

                                        <div className="space-y-4">
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-700">GET</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/electricity-providers</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-green-700">POST</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/electricity/verify</span>
                                                </div>
                                                <div className="p-4">
                                                    <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                        {`{ "provider": "ikeja_electric", "meternumber": "1234567890", "metertype": "prepaid" }`}
                                                    </pre>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-green-700">POST</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/electricity/purchase</span>
                                                </div>
                                                <div className="p-4">
                                                    <p className="text-sm font-semibold mb-2">Success Response:</p>
                                                    <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                        {`{
  "success": true,
  "message": "Electricity purchase successful",
  "data": {
    "transaction": { ... },
    "balance": 2500.00,
    "token": "1234-5678-9012-3456",
    "provider_response": { ... }
  }
}`}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Exam Pins</h3>
                                        <p className="text-slate-600 mb-4">Purchase Exam Pins (WAEC, NECO, etc).</p>

                                        <div className="space-y-4">
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-700">GET</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/exampin-providers</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-green-700">POST</span>
                                                    <span className="text-xs font-mono text-slate-600">/billpayment/exampin</span>
                                                </div>
                                                <div className="p-4">
                                                    <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg">
                                                        {`{ "provider": "waec", "quantity": 1 }`}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'test' && (
                                <div className="p-8">
                                    <div className="max-w-2xl">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Test API Integration</h2>
                                        <p className="text-slate-600 mb-8">
                                            Use this form to test the "Buy Data" endpoint using a generated API key.
                                        </p>

                                        <form onSubmit={handleTestApi} className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={testApiKey}
                                                    onChange={(e) => setTestApiKey(e.target.value)}
                                                    placeholder="sk_live_..."
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={testPhone}
                                                        onChange={(e) => setTestPhone(e.target.value)}
                                                        placeholder="08012345678"
                                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Network</label>
                                                    <select
                                                        value={testNetwork}
                                                        onChange={(e) => {
                                                            setTestNetwork(e.target.value);
                                                            setTestAmount(''); // Reset amount when network changes
                                                            setTestPlan(''); // Reset plan when network changes
                                                        }}
                                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="1">MTN</option>
                                                        <option value="2">Airtel</option>
                                                        <option value="3">Glo</option>
                                                        <option value="4">9mobile</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Plan</label>
                                                <select
                                                    value={testPlan}
                                                    onChange={(e) => {
                                                        setTestPlan(e.target.value);
                                                        const plan = plans.find((p: any) => p._id === e.target.value);
                                                        if (plan) {
                                                            const apiPrice = plan.price * (1 - (plan.api_discount || 0) / 100);
                                                            setTestAmount(apiPrice.toFixed(2));
                                                        }
                                                    }}
                                                    required
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select a plan</option>
                                                    {plans
                                                        .filter((p: any) => p.providerId === parseInt(testNetwork) && p.type === 'DATA')
                                                        .map((p: any) => (
                                                            <option key={p._id} value={p._id}>
                                                                {p.name} - ₦{(p.price * (1 - (p.api_discount || 0) / 100)).toFixed(2)}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₦)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={testAmount}
                                                    readOnly
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-slate-100 focus:outline-none cursor-not-allowed"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isTesting}
                                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isTesting ? (
                                                    <>
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Execute API Call'
                                                )}
                                            </button>
                                        </form>

                                        {testResult && (
                                            <div className={`mt-8 p-6 rounded-2xl border \${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                                }`}>
                                                <h3 className={`text-sm font-bold mb-3 \${testResult.success ? 'text-green-800' : 'text-red-800'
                                                    }`}>
                                                    API RESPONSE
                                                </h3>
                                                <pre className="text-xs font-mono overflow-auto max-h-64">
                                                    {JSON.stringify(testResult, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ApiManagement;
