'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Replace with your actual Supabase details
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function BemFundraiser() {
  const [bdtRaised, setBdtRaised] = useState(0);
  const [donations, setDonations] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', mfs: 'bKash', trxId: '' });

  const GOAL_AUD = 24000;
  const AUD_TO_BDT_RATE = 78;

  useEffect(() => {
    fetchDonations();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, (payload) => {
        setDonations((prev) => [payload.new, ...prev]);
        setBdtRaised((prev) => prev + Number(payload.new.amount_bdt));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchDonations() {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setDonations(data);
      const total = data.reduce((sum, item) => sum + Number(item.amount_bdt), 0);
      setBdtRaised(total);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.trxId) return alert('Please enter amount and TrxID');

    await supabase.from('donations').insert([
      {
        donor_name: form.name || 'Anonymous',
        amount_bdt: form.amount,
        mfs: form.mfs,
        trx_id: form.trxId,
      },
    ]);

    setForm({ name: '', amount: '', mfs: 'bKash', trxId: '' });
    alert('Thank you! Your donation is recorded and reflected live.');
  }

  const currentAUD = Math.round(bdtRaised / AUD_TO_BDT_RATE);
  const percentage = Math.min(((currentAUD / GOAL_AUD) * 100).toFixed(1), 100);

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Help Bem Fight Miller Fisher Syndrome (GBS)</h1>
        <p className="text-sm text-gray-600 mt-1">Bangladeshi Community Micro-Donation Bridge</p>

        <div className="my-6 p-4 bg-gray-50 border rounded-xl">
          <div className="flex justify-between font-semibold text-lg">
            <span>৳{bdtRaised.toLocaleString()} BDT Raised</span>
            <span className="text-green-600">~${currentAUD} AUD</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Goal: ${GOAL_AUD.toLocaleString()} AUD (~৳{(GOAL_AUD * AUD_TO_BDT_RATE).toLocaleString()} BDT)
          </p>

          <div className="w-full bg-gray-200 h-4 rounded-full mt-3 overflow-hidden">
            <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
          </div>
          <p className="text-right text-xs font-bold text-green-700 mt-1">{percentage}% of goal reached</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl">
          <h3 className="font-bold text-blue-900">How to Donate via bKash / Nagad:</h3>
          <p className="text-sm text-blue-800 mt-1">
            Send any amount (50, 100, 1000 BDT) via <strong>Send Money</strong> to:
          </p>
          <p className="text-lg font-bold text-blue-950 my-1">bKash / Nagad: 017XXXXXXXX</p>
          <p className="text-xs text-blue-700">
            Copy the Transaction ID (TrxID) from your SMS and submit it below to update the live counter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 border rounded-xl shadow-sm mb-6">
          <input
            type="text"
            placeholder="Your Name (Leave blank for Anonymous)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border p-2 rounded text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount in BDT (e.g. 500)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-1/2 border p-2 rounded text-sm"
              required
            />
            <select
              value={form.mfs}
              onChange={(e) => setForm({ ...form, mfs: e.target.value })}
              className="w-1/2 border p-2 rounded text-sm"
            >
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="bKash/Nagad Transaction ID (TrxID)"
            value={form.trxId}
            onChange={(e) => setForm({ ...form, trxId: e.target.value })}
            className="w-full border p-2 rounded text-sm"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-sm"
          >
            Submit & Add to Live Counter
          </button>
        </form>

        <h3 className="font-bold text-gray-800 mb-3">Recent Supporters ({donations.length})</h3>
        <div className="space-y-2">
          {donations.slice(0, 10).map((d, index) => (
            <div key={index} className="flex justify-between items-center border-b pb-2 text-sm">
              <div>
                <p className="font-semibold text-gray-800">{d.donor_name}</p>
                <p className="text-xs text-gray-400">{d.mfs} • TrxID: {d.trx_id}</p>
              </div>
              <span className="font-bold text-green-600">+৳{d.amount_bdt} BDT</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}