"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Address = {
  id: string; fullName: string; phone: string; addressLine1: string;
  addressLine2?: string | null; city: string; state: string;
  country: string; postalCode?: string | null; isDefault: boolean;
};

const inputClass = "w-full border border-[#e8e2db] px-4 py-2.5 text-[13.5px] text-[#1a1008] outline-none focus:border-[#1a1008] transition-colors font-serif placeholder:text-[#c8c0b8] bg-white";

const emptyForm = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", country: "Nigeria", postalCode: "", isDefault: false };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [form,      setForm]      = useState(emptyForm);

  useEffect(() => {
    fetch("/api/account/addresses").then(r => r.json())
      .then(d => { if (d.success) setAddresses(d.data); })
      .finally(() => setLoading(false));
  }, []);

  function set(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.state) {
      setError("Please fill in all required fields."); return;
    }
    setSaving(true);
    const res  = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) {
      setAddresses(prev => data.data.isDefault ? [data.data, ...prev.map(a => ({ ...a, isDefault: false }))] : [...prev, data.data]);
      setShowForm(false);
      setForm(emptyForm);
    } else {
      setError(data.error ?? "Failed to save address.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    if ((await res.json()).success) setAddresses(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-serif">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="mb-8">
          <Link href="/account" className="text-[11.5px] tracking-[0.15em] text-[#8a7a6a] hover:text-[#1a1008] transition-colors">← My Account</Link>
          <h1 className="text-[30px] text-[#1a1008] mt-2" style={{ fontFamily: "var(--font-script), cursive" }}>Delivery Addresses</h1>
        </div>

        {loading ? (
          <div className="text-[12.5px] tracking-widest text-[#8a7a6a]">Loading…</div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              {addresses.map(addr => (
                <div key={addr.id} className="bg-white border border-[#e8e2db] p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13.5px] text-[#1a1008]">{addr.fullName}</p>
                      {addr.isDefault && <span className="px-2 py-0.5 text-[10.5px] tracking-wide bg-[#1a1008] text-white rounded-full">Default</span>}
                    </div>
                    <p className="text-[13px] text-[#8a7a6a] leading-relaxed">
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br/>
                      {addr.city}, {addr.state}, {addr.country}<br/>
                      {addr.phone}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(addr.id)} className="text-[11.5px] text-[#8a7a6a] hover:text-red-600 underline underline-offset-2 transition-colors flex-shrink-0">Delete</button>
                </div>
              ))}
              {addresses.length === 0 && !showForm && (
                <div className="bg-white border border-[#e8e2db] p-10 text-center">
                  <p className="text-[13.5px] text-[#8a7a6a]">No saved addresses yet.</p>
                </div>
              )}
            </div>

            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="border border-[#1a1008] px-6 py-2.5 text-[12px] tracking-[0.15em] uppercase text-[#1a1008] hover:bg-[#1a1008] hover:text-white transition-colors">
                + Add New Address
              </button>
            ) : (
              <div className="bg-white border border-[#e8e2db] p-6">
                <h2 className="text-[12.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-5">New Address</h2>
                {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>}
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Full Name</label>
                      <input type="text" value={form.fullName} onChange={e => set("fullName", e.target.value)} required placeholder="Amara Johnson" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} required placeholder="+234 800 000 0000" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Address Line 1</label>
                    <input type="text" value={form.addressLine1} onChange={e => set("addressLine1", e.target.value)} required placeholder="123 Victoria Island" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Address Line 2 <span className="text-[#c8c0b8] normal-case tracking-normal">(optional)</span></label>
                    <input type="text" value={form.addressLine2} onChange={e => set("addressLine2", e.target.value)} placeholder="Flat, suite, etc." className={inputClass} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">City</label>
                      <input type="text" value={form.city} onChange={e => set("city", e.target.value)} required placeholder="Lagos" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">State</label>
                      <input type="text" value={form.state} onChange={e => set("state", e.target.value)} required placeholder="Lagos State" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[11.5px] tracking-[0.2em] text-[#8a7a6a] uppercase mb-1.5">Country</label>
                      <input type="text" value={form.country} onChange={e => set("country", e.target.value)} required className={inputClass} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isDefault} onChange={e => set("isDefault", e.target.checked)} className="w-4 h-4 accent-[#1a1008]" />
                    <span className="text-[12.5px] tracking-wide text-[#3a2e22]">Set as default address</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving} className="bg-[#1a1008] text-white text-[12px] tracking-[0.15em] uppercase px-6 py-2.5 hover:bg-[#4B3E3C] transition-colors disabled:opacity-50">
                      {saving ? "Saving…" : "Save Address"}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setError(null); setForm(emptyForm); }}
                      className="border border-[#e8e2db] text-[12px] tracking-[0.15em] uppercase px-6 py-2.5 text-[#8a7a6a] hover:border-[#1a1008] transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
