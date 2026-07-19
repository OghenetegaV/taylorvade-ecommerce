"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import CartSidebar from "./CartSidebar";
import SearchOverlay from "./SearchOverlay";

const HamburgerIcon = () => (
  <svg width="25" height="18" viewBox="0 0 20 13" fill="none">
    <line x1="0" y1="1"   x2="20" y2="1"   stroke="#3a2e22" strokeWidth="1.1"/>
    <line x1="0" y1="6.5" x2="20" y2="6.5" stroke="#3a2e22" strokeWidth="1.1"/>
    <line x1="0" y1="12"  x2="20" y2="12"  stroke="#3a2e22" strokeWidth="1.1"/>
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="#3a2e22" strokeWidth="1" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/>
    <line x1="16.5" y1="16.5" x2="22" y2="22"/>
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="#3a2e22" strokeWidth="1" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const BagIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="#3a2e22" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="#3a2e22" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

const EiffelIcon = () => (
  <svg width="32" height="46" viewBox="0 0 32 46" fill="none">
    <rect x="15" y="0" width="2" height="4" fill="#3a2e22"/>
    <polygon points="16,4 12,14 20,14" fill="#3a2e22"/>
    <polygon points="12,14 8,22 24,22 20,14" fill="#3a2e22"/>
    <line x1="8" y1="18" x2="24" y2="18" stroke="#3a2e22" strokeWidth="1.2"/>
    <polygon points="8,22 4,32 28,32 24,22" fill="#3a2e22"/>
    <line x1="4" y1="28" x2="28" y2="28" stroke="#3a2e22" strokeWidth="1.2"/>
    <polygon points="4,32 2,44 30,44 28,32" fill="#3a2e22"/>
  </svg>
);

const NigeriaFlag = () => (
  <svg width="22" height="22" viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
    <rect x="0" width="1" height="2" fill="#008751"/>
    <rect x="1" width="1" height="2" fill="#ffffff"/>
    <rect x="2" width="1" height="2" fill="#008751"/>
  </svg>
);

const primaryLinks = [
  { label: "Taylor Vade Woman",  href: "/collections/woman" },
  { label: "Taylor Vade Man",    href: "/collections/man" },
  { label: "Taylor Vade Unisex", href: "/collections/unisex" },
];
const secondaryLinks = [
  { label: "Our Stores",  href: "/stores" },
  { label: "Gift Cards",  href: "/gift-cards" },
  { label: "TV Rewards",  href: "/rewards" },
  { label: "About Us",    href: "/about" },
];

const SUGGESTED_CURRENCIES = ["NGN", "USD", "GBP", "CAD"];
const ALL_COUNTRIES: string[] = ["Afghanistan","Aland","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Ascension Island","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bonaire","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Cook Islands","Costa Rica","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Ivory Coast","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar (Burma)","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","North Korea","North Macedonia","Northern Mariana Islands","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn Islands","Poland","Portugal","Puerto Rico","Qatar","Republic of the Congo","Reunion","Romania","Russia","Rwanda","Saint Barthelemy","Saint Helena","Saint Kitts and Nevis","Saint Lucia","Saint Martin","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tokelau","Tonga","Trinidad and Tobago","Tristan da Cunha","Tunisia","Turkmenistan","Turks and Caicos Islands","Tuvalu","Türkiye","U.S. Minor Outlying Islands","U.S. Virgin Islands","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"];
const ALL_CURRENCIES: string[] = ["AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BHD","BIF","BMD","BND","BOB","BOV","BRL","BSD","BTN","BWP","BYN","BZD","CAD","CDF","CHE","CHF","CHW","CLF","CLP","CNY","COP","CRC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","SSP","STN","SVC","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","USN","USS","UYI","UYU","UZS","VES","VND","VUV","WST","XAF","XCD","XOF","XPF","YER","ZAR","ZMW"];

const FULL_TEXT = "Taylor Vade";
const ICON = "w-[16px] h-[16px] md:w-[20px] md:h-[20px]";

export default function Header() {
  const router = useRouter();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [search,     setSearch]     = useState("");
  const [country,    setCountry]    = useState("Nigeria");
  const [currency,   setCurrency]   = useState("NGN");
  const [displayed,  setDisplayed]  = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [cartCount,  setCartCount]  = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!menuOpen) { setDisplayed(""); return; }
    let i = 0;
    setDisplayed("");
    const iv = setInterval(() => {
      i++;
      setDisplayed(FULL_TEXT.slice(0, i));
      if (i >= FULL_TEXT.length) clearInterval(iv);
    }, 90);
    return () => clearInterval(iv);
  }, [menuOpen]);

  useEffect(() => {
    const savedCountry  = localStorage.getItem("tv_country");
    const savedCurrency = localStorage.getItem("tv_currency");
    if (savedCountry)  setCountry(savedCountry);
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/cart").then(r => r.json()).then(d => {
      if (d.success) setCartCount(d.data.itemCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleUpdatePreferences() {
    localStorage.setItem("tv_country",  country);
    localStorage.setItem("tv_currency", currency);
    setRegionOpen(false);
  }

  function handleDrawerSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-[#FAF9F780]" : "bg-transparent"
      }`}>
        <div className="relative flex items-center justify-between px-5 md:px-9 py-6">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="flex items-center">
            <HamburgerIcon />
          </button>

          <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-[150px] md:w-[400px] h-[40px] md:h-[50px]">
              <Image src="/logo.png" alt="Taylor Vade" fill priority className="object-contain"/>
            </div>
          </Link>

          <div className="flex items-center gap-[10px] md:gap-[14px] opacity-75">
            <button aria-label="Search" onClick={() => setMenuOpen(true)} className="hidden md:flex">
              <SearchIcon className={ICON} />
            </button>
            <Link href={isLoggedIn ? "/account" : "/login"} aria-label="Account">
              <UserIcon className={ICON} />
            </Link>
            <button aria-label="Bag" onClick={() => setCartOpen(true)} className="relative">
              <BagIcon className={ICON} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-[2px]
                  bg-[#3a2e22] text-[#FAF9F7] text-[8px] font-serif tracking-wide
                  rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
            <button
              aria-label="Region"
              onClick={() => setRegionOpen(true)}
              className="w-[22px] h-[22px] rounded-full overflow-hidden flex-shrink-0 border border-[#3a2e2240]"
              style={{ padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <NigeriaFlag />
            </button>
          </div>
        </div>
      </header>

      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div className={`fixed top-0 left-0 h-full w-[290px] max-w-[80vw] z-[100] flex flex-col
        bg-[#FAF9F7] transition-transform duration-300 ease-in-out ${
        menuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <form onSubmit={handleDrawerSearch} className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3a2e22"
            strokeWidth="1.4" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[11px] tracking-[0.12em] outline-none bg-transparent
              text-[#3a2e22] placeholder:text-[#3a2e22] font-serif border-b border-[#d5cec4] pb-1"
          />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
            <X size={15} strokeWidth={1.3} className="text-[#3a2e22]" />
          </button>
        </form>

        <nav className="flex flex-col px-5 pt-4">
          {primaryLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="py-3 text-[11.5px] tracking-[0.1em] text-[#3a2e22] hover:opacity-50 transition-opacity font-serif">
              {l.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col px-5 pt-4">
          {secondaryLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="py-3 text-[11.5px] tracking-[0.1em] text-[#3a2e22] hover:opacity-50 transition-opacity font-serif">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-5 pb-8 select-none">
          <span className="text-[38px] leading-none text-[#3a2e22]"
            style={{ fontFamily: "var(--font-script), cursive" }}>
            {displayed}
            {displayed.length < FULL_TEXT.length && (
              <span className="animate-pulse opacity-60">|</span>
            )}
          </span>
        </div>
      </div>

      {regionOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div
            onClick={() => setRegionOpen(false)}
            className="fixed inset-0 z-[110] bg-black/50 transition-opacity duration-300"
          />
          <div
            className="relative bg-[#FAF9F7] w-[90vw] max-w-[420px] px-10 py-10 z-[120] transition-all duration-300 opacity-100 translate-y-0"
            style={{ boxShadow: "0 8px 40px 0 rgba(58,46,34,0.18), 0 1.5px 8px 0 rgba(58,46,34,0.10)" }}
          >
            <button onClick={() => setRegionOpen(false)}
              className="absolute top-4 right-4 text-[#3a2e22] hover:opacity-50 transition-opacity">
              <X size={16} strokeWidth={1.3} />
            </button>

            <div className="flex justify-center mb-5"><EiffelIcon /></div>

            <p className="text-center text-[11px] tracking-[0.12em] text-[#3a2e22] mb-2 font-serif">Ship To:</p>
            <div className="relative mb-5">
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full border border-[#3a2e22] bg-[#FAF9F7] px-4 py-2.5
                  text-[11px] text-center tracking-[0.06em] text-[#3a2e22] font-serif
                  appearance-none outline-none cursor-pointer">
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>

            <p className="text-center text-[11px] tracking-[0.12em] text-[#3a2e22] mb-2 font-serif">View Currency In:</p>
            <div className="relative mb-6">
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full border border-[#3a2e22] bg-[#FAF9F7] px-4 py-2.5
                  text-[11px] text-center tracking-[0.06em] text-[#3a2e22] font-serif
                  appearance-none outline-none cursor-pointer">
                <optgroup label="Suggested Currencies">
                  {SUGGESTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="All Currencies">
                  {ALL_CURRENCIES.filter(c => !SUGGESTED_CURRENCIES.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>

            <div className="text-center text-[10px] tracking-[0.06em] text-[#3a2e22] leading-loose mb-6 font-serif">
              <p>Free Delivery Over £150</p>
              <p>£2.99 Fixed-Fee UK Postal Returns</p>
              <p>Free In-Store Returns</p>
            </div>

            <div className="text-center">
              <button onClick={handleUpdatePreferences}
                className="text-[11px] tracking-[0.12em] text-[#3a2e22] font-serif
                  underline underline-offset-4 hover:opacity-50 transition-opacity">
                Update Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCountChange={setCartCount}
      />
    </>
  );
}