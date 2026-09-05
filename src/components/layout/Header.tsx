"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ShoppingBag } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CURRENCY_CHANGE_EVENT, formatConverted } from "@/lib/currency";
import { FREE_SHIPPING_THRESHOLD_NGN } from "@/lib/shipping";
import { prepareStorefrontCategories } from "@/lib/categoryOrder";
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons/SocialIcons";
import CartSidebar from "./CartSidebar";
import SearchOverlay from "./SearchOverlay";

// All header glyphs use currentColor so a single `style={{ color }}` on the
// button/link flips every icon between brand-dark and white (over a dark hero).
const HamburgerIcon = () => (
  <svg width="26" height="18" viewBox="0 0 20 13" fill="none">
    <line x1="0" y1="1"   x2="20" y2="1"   stroke="currentColor" strokeWidth="1.3"/>
    <line x1="0" y1="6.5" x2="20" y2="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="0" y1="12"  x2="20" y2="12"  stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/>
    <line x1="16.5" y1="16.5" x2="22" y2="22"/>
  </svg>
);

const WishlistIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const BagIcon = ({ className }: { className?: string }) => (
  <ShoppingBag className={className} strokeWidth={1.3} />
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

// Flag shown in the header mirrors whatever the shopper picks in the "Ship
// To" dropdown, so every entry in ALL_COUNTRIES needs an ISO 3166-1 alpha-2
// code to look up its flag image from.
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Afghanistan: "AF", Aland: "AX", Albania: "AL", Algeria: "DZ", "American Samoa": "AS",
  Andorra: "AD", Angola: "AO", Anguilla: "AI", Antarctica: "AQ", "Antigua and Barbuda": "AG",
  Argentina: "AR", Armenia: "AM", Aruba: "AW", "Ascension Island": "AC", Australia: "AU",
  Austria: "AT", Azerbaijan: "AZ", Bahamas: "BS", Bahrain: "BH", Bangladesh: "BD",
  Barbados: "BB", Belarus: "BY", Belgium: "BE", Belize: "BZ", Benin: "BJ",
  Bermuda: "BM", Bhutan: "BT", Bolivia: "BO", Bonaire: "BQ", "Bosnia and Herzegovina": "BA",
  Botswana: "BW", "Bouvet Island": "BV", Brazil: "BR", "British Indian Ocean Territory": "IO",
  "British Virgin Islands": "VG", Brunei: "BN", Bulgaria: "BG", "Burkina Faso": "BF",
  Burundi: "BI", Cambodia: "KH", Cameroon: "CM", Canada: "CA", "Cape Verde": "CV",
  "Cayman Islands": "KY", "Central African Republic": "CF", Chad: "TD", Chile: "CL",
  China: "CN", "Christmas Island": "CX", "Cocos (Keeling) Islands": "CC", Colombia: "CO",
  Comoros: "KM", "Cook Islands": "CK", "Costa Rica": "CR", Croatia: "HR", Cuba: "CU",
  Curacao: "CW", Cyprus: "CY", "Czech Republic": "CZ", "Democratic Republic of the Congo": "CD",
  Denmark: "DK", Djibouti: "DJ", Dominica: "DM", "Dominican Republic": "DO", "East Timor": "TL",
  Ecuador: "EC", Egypt: "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ", Eritrea: "ER",
  Estonia: "EE", Eswatini: "SZ", Ethiopia: "ET", "Falkland Islands": "FK", "Faroe Islands": "FO",
  Fiji: "FJ", Finland: "FI", France: "FR", "French Guiana": "GF", "French Polynesia": "PF",
  "French Southern Territories": "TF", Gabon: "GA", Gambia: "GM", Georgia: "GE", Germany: "DE",
  Ghana: "GH", Gibraltar: "GI", Greece: "GR", Greenland: "GL", Grenada: "GD",
  Guadeloupe: "GP", Guam: "GU", Guatemala: "GT", Guernsey: "GG", Guinea: "GN",
  "Guinea-Bissau": "GW", Guyana: "GY", Haiti: "HT", "Heard Island and McDonald Islands": "HM",
  Honduras: "HN", "Hong Kong": "HK", Hungary: "HU", Iceland: "IS", India: "IN",
  Indonesia: "ID", Iran: "IR", Iraq: "IQ", Ireland: "IE", "Isle of Man": "IM",
  Israel: "IL", Italy: "IT", "Ivory Coast": "CI", Jamaica: "JM", Japan: "JP",
  Jersey: "JE", Jordan: "JO", Kazakhstan: "KZ", Kenya: "KE", Kiribati: "KI",
  Kosovo: "XK", Kuwait: "KW", Kyrgyzstan: "KG", Laos: "LA", Latvia: "LV",
  Lebanon: "LB", Lesotho: "LS", Liberia: "LR", Libya: "LY", Liechtenstein: "LI",
  Lithuania: "LT", Luxembourg: "LU", Macao: "MO", Madagascar: "MG", Malawi: "MW",
  Malaysia: "MY", Maldives: "MV", Mali: "ML", Malta: "MT", "Marshall Islands": "MH",
  Martinique: "MQ", Mauritania: "MR", Mauritius: "MU", Mayotte: "YT", Mexico: "MX",
  Micronesia: "FM", Moldova: "MD", Monaco: "MC", Mongolia: "MN", Montenegro: "ME",
  Montserrat: "MS", Morocco: "MA", Mozambique: "MZ", "Myanmar (Burma)": "MM", Namibia: "NA",
  Nauru: "NR", Nepal: "NP", Netherlands: "NL", "New Caledonia": "NC", "New Zealand": "NZ",
  Nicaragua: "NI", Niger: "NE", Nigeria: "NG", Niue: "NU", "Norfolk Island": "NF",
  "North Korea": "KP", "North Macedonia": "MK", "Northern Mariana Islands": "MP", Norway: "NO",
  Oman: "OM", Pakistan: "PK", Palau: "PW", Palestine: "PS", Panama: "PA",
  "Papua New Guinea": "PG", Paraguay: "PY", Peru: "PE", Philippines: "PH", "Pitcairn Islands": "PN",
  Poland: "PL", Portugal: "PT", "Puerto Rico": "PR", Qatar: "QA", "Republic of the Congo": "CG",
  Reunion: "RE", Romania: "RO", Russia: "RU", Rwanda: "RW", "Saint Barthelemy": "BL",
  "Saint Helena": "SH", "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", "Saint Martin": "MF",
  "Saint Pierre and Miquelon": "PM", "Saint Vincent and the Grenadines": "VC", Samoa: "WS",
  "San Marino": "SM", "Sao Tome and Principe": "ST", "Saudi Arabia": "SA", Senegal: "SN",
  Serbia: "RS", Seychelles: "SC", "Sierra Leone": "SL", Singapore: "SG", "Sint Maarten": "SX",
  Slovakia: "SK", Slovenia: "SI", "Solomon Islands": "SB", Somalia: "SO", "South Africa": "ZA",
  "South Georgia and the South Sandwich Islands": "GS", "South Korea": "KR", "South Sudan": "SS",
  Spain: "ES", "Sri Lanka": "LK", Sudan: "SD", Suriname: "SR", "Svalbard and Jan Mayen": "SJ",
  Sweden: "SE", Switzerland: "CH", Syria: "SY", Taiwan: "TW", Tajikistan: "TJ",
  Tanzania: "TZ", Thailand: "TH", Togo: "TG", Tokelau: "TK", Tonga: "TO",
  "Trinidad and Tobago": "TT", "Tristan da Cunha": "TA", Tunisia: "TN", Turkmenistan: "TM",
  "Turks and Caicos Islands": "TC", Tuvalu: "TV", Türkiye: "TR", "U.S. Minor Outlying Islands": "UM",
  "U.S. Virgin Islands": "VI", Uganda: "UG", Ukraine: "UA", "United Arab Emirates": "AE",
  "United Kingdom": "GB", "United States": "US", Uruguay: "UY", Uzbekistan: "UZ",
  Vanuatu: "VU", "Vatican City": "VA", Venezuela: "VE", Vietnam: "VN", "Wallis and Futuna": "WF",
  "Western Sahara": "EH", Yemen: "YE", Zambia: "ZM", Zimbabwe: "ZW",
};

// Picking a country suggests that country's currency, but the shopper can
// still override it independently afterward via the currency select below.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  Afghanistan: "AFN", Aland: "EUR", Albania: "ALL", Algeria: "DZD", "American Samoa": "USD",
  Andorra: "EUR", Angola: "AOA", Anguilla: "XCD", Antarctica: "USD", "Antigua and Barbuda": "XCD",
  Argentina: "ARS", Armenia: "AMD", Aruba: "AWG", "Ascension Island": "SHP", Australia: "AUD",
  Austria: "EUR", Azerbaijan: "AZN", Bahamas: "BSD", Bahrain: "BHD", Bangladesh: "BDT",
  Barbados: "BBD", Belarus: "BYN", Belgium: "EUR", Belize: "BZD", Benin: "XOF",
  Bermuda: "BMD", Bhutan: "BTN", Bolivia: "BOB", Bonaire: "USD", "Bosnia and Herzegovina": "BAM",
  Botswana: "BWP", "Bouvet Island": "NOK", Brazil: "BRL", "British Indian Ocean Territory": "USD",
  "British Virgin Islands": "USD", Brunei: "BND", Bulgaria: "EUR", "Burkina Faso": "XOF",
  Burundi: "BIF", Cambodia: "KHR", Cameroon: "XAF", Canada: "CAD", "Cape Verde": "CVE",
  "Cayman Islands": "KYD", "Central African Republic": "XAF", Chad: "XAF", Chile: "CLP",
  China: "CNY", "Christmas Island": "AUD", "Cocos (Keeling) Islands": "AUD", Colombia: "COP",
  Comoros: "KMF", "Cook Islands": "NZD", "Costa Rica": "CRC", Croatia: "EUR", Cuba: "CUP",
  Curacao: "ANG", Cyprus: "EUR", "Czech Republic": "CZK", "Democratic Republic of the Congo": "CDF",
  Denmark: "DKK", Djibouti: "DJF", Dominica: "XCD", "Dominican Republic": "DOP", "East Timor": "USD",
  Ecuador: "USD", Egypt: "EGP", "El Salvador": "USD", "Equatorial Guinea": "XAF", Eritrea: "ERN",
  Estonia: "EUR", Eswatini: "SZL", Ethiopia: "ETB", "Falkland Islands": "FKP", "Faroe Islands": "DKK",
  Fiji: "FJD", Finland: "EUR", France: "EUR", "French Guiana": "EUR", "French Polynesia": "XPF",
  "French Southern Territories": "EUR", Gabon: "XAF", Gambia: "GMD", Georgia: "GEL", Germany: "EUR",
  Ghana: "GHS", Gibraltar: "GIP", Greece: "EUR", Greenland: "DKK", Grenada: "XCD",
  Guadeloupe: "EUR", Guam: "USD", Guatemala: "GTQ", Guernsey: "GBP", Guinea: "GNF",
  "Guinea-Bissau": "XOF", Guyana: "GYD", Haiti: "HTG", "Heard Island and McDonald Islands": "AUD",
  Honduras: "HNL", "Hong Kong": "HKD", Hungary: "HUF", Iceland: "ISK", India: "INR",
  Indonesia: "IDR", Iran: "IRR", Iraq: "IQD", Ireland: "EUR", "Isle of Man": "GBP",
  Israel: "ILS", Italy: "EUR", "Ivory Coast": "XOF", Jamaica: "JMD", Japan: "JPY",
  Jersey: "GBP", Jordan: "JOD", Kazakhstan: "KZT", Kenya: "KES", Kiribati: "AUD",
  Kosovo: "EUR", Kuwait: "KWD", Kyrgyzstan: "KGS", Laos: "LAK", Latvia: "EUR",
  Lebanon: "LBP", Lesotho: "LSL", Liberia: "LRD", Libya: "LYD", Liechtenstein: "CHF",
  Lithuania: "EUR", Luxembourg: "EUR", Macao: "MOP", Madagascar: "MGA", Malawi: "MWK",
  Malaysia: "MYR", Maldives: "MVR", Mali: "XOF", Malta: "EUR", "Marshall Islands": "USD",
  Martinique: "EUR", Mauritania: "MRU", Mauritius: "MUR", Mayotte: "EUR", Mexico: "MXN",
  Micronesia: "USD", Moldova: "MDL", Monaco: "EUR", Mongolia: "MNT", Montenegro: "EUR",
  Montserrat: "XCD", Morocco: "MAD", Mozambique: "MZN", "Myanmar (Burma)": "MMK", Namibia: "NAD",
  Nauru: "AUD", Nepal: "NPR", Netherlands: "EUR", "New Caledonia": "XPF", "New Zealand": "NZD",
  Nicaragua: "NIO", Niger: "XOF", Nigeria: "NGN", Niue: "NZD", "Norfolk Island": "AUD",
  "North Korea": "KPW", "North Macedonia": "MKD", "Northern Mariana Islands": "USD", Norway: "NOK",
  Oman: "OMR", Pakistan: "PKR", Palau: "USD", Palestine: "ILS", Panama: "PAB",
  "Papua New Guinea": "PGK", Paraguay: "PYG", Peru: "PEN", Philippines: "PHP", "Pitcairn Islands": "NZD",
  Poland: "PLN", Portugal: "EUR", "Puerto Rico": "USD", Qatar: "QAR", "Republic of the Congo": "XAF",
  Reunion: "EUR", Romania: "RON", Russia: "RUB", Rwanda: "RWF", "Saint Barthelemy": "EUR",
  "Saint Helena": "SHP", "Saint Kitts and Nevis": "XCD", "Saint Lucia": "XCD", "Saint Martin": "EUR",
  "Saint Pierre and Miquelon": "EUR", "Saint Vincent and the Grenadines": "XCD", Samoa: "WST",
  "San Marino": "EUR", "Sao Tome and Principe": "STN", "Saudi Arabia": "SAR", Senegal: "XOF",
  Serbia: "RSD", Seychelles: "SCR", "Sierra Leone": "SLL", Singapore: "SGD", "Sint Maarten": "ANG",
  Slovakia: "EUR", Slovenia: "EUR", "Solomon Islands": "SBD", Somalia: "SOS", "South Africa": "ZAR",
  "South Georgia and the South Sandwich Islands": "GBP", "South Korea": "KRW", "South Sudan": "SSP",
  Spain: "EUR", "Sri Lanka": "LKR", Sudan: "SDG", Suriname: "SRD", "Svalbard and Jan Mayen": "NOK",
  Sweden: "SEK", Switzerland: "CHF", Syria: "SYP", Taiwan: "TWD", Tajikistan: "TJS",
  Tanzania: "TZS", Thailand: "THB", Togo: "XOF", Tokelau: "NZD", Tonga: "TOP",
  "Trinidad and Tobago": "TTD", "Tristan da Cunha": "SHP", Tunisia: "TND", Turkmenistan: "TMT",
  "Turks and Caicos Islands": "USD", Tuvalu: "AUD", Türkiye: "TRY", "U.S. Minor Outlying Islands": "USD",
  "U.S. Virgin Islands": "USD", Uganda: "UGX", Ukraine: "UAH", "United Arab Emirates": "AED",
  "United Kingdom": "GBP", "United States": "USD", Uruguay: "UYU", Uzbekistan: "UZS",
  Vanuatu: "VUV", "Vatican City": "EUR", Venezuela: "VES", Vietnam: "VND", "Wallis and Futuna": "XPF",
  "Western Sahara": "MAD", Yemen: "YER", Zambia: "ZMW", Zimbabwe: "USD",
};

const CountryFlag = ({ country, className }: { country: string; className?: string }) => {
  const code = COUNTRY_NAME_TO_CODE[country];
  if (!code) return <NigeriaFlag />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt={country}
      className={className ?? "w-full h-full object-cover"}
    />
  );
};

const primaryLinks = [
  { label: "Taylor Vade Woman",  href: "/collections/woman",  gender: "WOMEN" },
  { label: "Taylor Vade Man",    href: "/collections/man",    gender: "MEN" },
  { label: "Taylor Vade Unisex", href: "/collections/unisex", gender: null },
];
const secondaryLinks = [
  { label: "About Us",   href: "/about" },
  { label: "Collection",  href: "/collection" },
  { label: "Size Chart",  href: "/size-guide" },
  // { label: "",  href: "/rewards" },
];

const WHATSAPP_NUMBER = "2349030305584";

const SOCIALS = [
  { label: "WhatsApp",  href: `https://wa.me/${WHATSAPP_NUMBER}`, Icon: WhatsAppIcon },
  { label: "Instagram", href: "https://www.instagram.com/taylor_vade/", Icon: InstagramIcon },
  { label: "TikTok",    href: "https://www.tiktok.com/@taylorvade", Icon: TikTokIcon },
  { label: "Facebook",  href: "https://www.facebook.com/taylorvade", Icon: FacebookIcon },
];

const SUGGESTED_CURRENCIES = ["NGN", "USD", "GBP", "CAD"];
const ALL_COUNTRIES: string[] = ["Afghanistan","Aland","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Ascension Island","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bonaire","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Cook Islands","Costa Rica","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Ivory Coast","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar (Burma)","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","North Korea","North Macedonia","Northern Mariana Islands","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn Islands","Poland","Portugal","Puerto Rico","Qatar","Republic of the Congo","Reunion","Romania","Russia","Rwanda","Saint Barthelemy","Saint Helena","Saint Kitts and Nevis","Saint Lucia","Saint Martin","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tokelau","Tonga","Trinidad and Tobago","Tristan da Cunha","Tunisia","Turkmenistan","Turks and Caicos Islands","Tuvalu","Türkiye","U.S. Minor Outlying Islands","U.S. Virgin Islands","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"];
const ALL_CURRENCIES: string[] = ["AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BHD","BIF","BMD","BND","BOB","BOV","BRL","BSD","BTN","BWP","BYN","BZD","CAD","CDF","CHE","CHF","CHW","CLF","CLP","CNY","COP","CRC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","SSP","STN","SVC","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","USN","USS","UYI","UYU","UZS","VES","VND","VUV","WST","XAF","XCD","XOF","XPF","YER","ZAR","ZMW"];

const ICON = "w-[17px] h-[17px] md:w-[22px] md:h-[22px]";

export default function Header() {
  const pathname = usePathname();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [search,     setSearch]     = useState("");
  const [country,    setCountry]    = useState("Nigeria");
  const [currency,   setCurrency]   = useState("NGN");
  const [fxRates,    setFxRates]    = useState<Record<string, number> | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [cartTab,    setCartTab]    = useState<"basket" | "wishlist">("basket");
  const [cartCount,  setCartCount]  = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [overHero,   setOverHero]   = useState(pathname === "/");
  const [scrolled,   setScrolled]   = useState(false);
  const [navCategories, setNavCategories] = useState<{ id: string; name: string; slug: string; gender: string }[]>([]);
  const [expandedGender, setExpandedGender] = useState<string | null>(null);

  const isHome = pathname === "/";
  const isCheckout = pathname.startsWith("/checkout");
  const iconColor = overHero ? "#FAF9F7" : "#3a2e22";
  // Mobile: solid header at rest, fading to transparent on scroll (skipped on
  // the homepage, which already has its own transparent-over-hero treatment).
  // Checkout stays solid always — its content (order summary, form fields)
  // scrolls directly under the header, so a transparent header there would
  // let that content show through behind the logo/icons.
  const mobileBgClass = isHome ? "" : isCheckout ? "bg-[#FAF9F7]" : scrolled ? "bg-transparent" : "bg-[#FAF9F7]";

  function openCart(tab: "basket" | "wishlist") {
    setCartTab(tab);
    setCartOpen(true);
  }

  // Product page dispatches this right after a successful add-to-cart so the
  // bag drawer pops open, matching the reference site's behaviour.
  useEffect(() => {
    const onOpenCartDrawer = () => openCart("basket");
    window.addEventListener("openCartDrawer", onOpenCartDrawer);
    return () => window.removeEventListener("openCartDrawer", onOpenCartDrawer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const savedCountry  = localStorage.getItem("tv_country");
    const savedCurrency = localStorage.getItem("tv_currency");
    if (savedCountry)  setCountry(savedCountry);
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  useEffect(() => {
    fetch("/api/currency/rates").then(r => r.json()).then(d => {
      if (d.success) setFxRates(d.data.rates);
    }).catch(() => {});
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => {
      if (d.success) setNavCategories(d.data);
    }).catch(() => {});
  }, []);

  // Icons/wordmark render white while floating over the homepage hero (a
  // full-height dark photo), and the brand-dark colour everywhere else —
  // including once you've scrolled past the hero on the homepage itself.
  useEffect(() => {
    if (pathname !== "/") { setOverHero(false); return; }
    const onScroll = () => setOverHero(window.scrollY < window.innerHeight - 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  function handleUpdatePreferences() {
    localStorage.setItem("tv_country",  country);
    localStorage.setItem("tv_currency", currency);
    window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: currency }));
    setRegionOpen(false);
  }

  function handleDrawerSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setMenuOpen(false);
    setSearchOpen(true);
  }

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 md:bg-transparent ${mobileBgClass}`}>
        <div className="relative flex items-center justify-between px-4 md:px-9 py-5"
          style={{ color: iconColor, transition: "color 300ms ease" }}>
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="flex items-center">
            <HamburgerIcon />
          </button>

          <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-[88px] md:w-[190px] h-[26px] md:h-[46px]"
              style={{ filter: overHero ? "invert(1) brightness(2)" : "none", transition: "filter 300ms ease" }}>
              <Image src="/logo.png" alt="Taylor Vade" fill priority className="object-contain"/>
            </div>
          </Link>

          <div className="flex items-center gap-[7px] md:gap-[15px]">
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="hidden md:flex">
              <SearchIcon className={ICON} />
            </button>
            <button aria-label="Wishlist" onClick={() => openCart("wishlist")}>
              <WishlistIcon className={ICON} />
            </button>
            <Link href={isLoggedIn ? "/account" : "/login"} aria-label="Account">
              <UserIcon className={ICON} />
            </Link>
            <button aria-label="Bag" onClick={() => openCart("basket")} className="relative">
              <BagIcon className={ICON} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-[2px]
                  bg-[#4B3E3C] text-[#FAF9F7] text-[9.5px] font-serif tracking-wide
                  rounded-full flex items-center justify-center leading-none"
                  style={{ color: "#FAF9F7" }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
            <button
              aria-label="Region"
              onClick={() => setRegionOpen(true)}
              className="w-[19px] h-[19px] md:w-[23px] md:h-[23px] rounded-full overflow-hidden flex-shrink-0"
              style={{ padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <CountryFlag country={country} />
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
            className="flex-1 text-[12.5px] tracking-[0.12em] outline-none bg-transparent
              text-[#3a2e22] placeholder:text-[#3a2e22] font-serif border-b border-[#d5cec4] pb-1"
          />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
            <X size={15} strokeWidth={1.3} className="text-[#3a2e22]" />
          </button>
        </form>

        <nav className="flex flex-col px-5 pt-4">
          {primaryLinks.map(l => {
            const subcats = l.gender
              ? prepareStorefrontCategories(navCategories.filter(c => c.gender === l.gender))
              : [];
            const expanded = expandedGender === l.gender;
            return (
              <div key={l.href}>
                <div className="flex items-center justify-between">
                  <Link href={l.href} onClick={() => setMenuOpen(false)}
                    className="py-3 text-[13px] tracking-[0.1em] text-[#3a2e22] hover:opacity-50 transition-opacity font-serif">
                    {l.label}
                  </Link>
                  {subcats.length > 0 && (
                    <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${l.label} categories`}
                      onClick={() => setExpandedGender(expanded ? null : l.gender)}
                      className={`p-2 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
                      <ChevronDown />
                    </button>
                  )}
                </div>
                {subcats.length > 0 && (
                  <div className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: expanded ? subcats.length * 40 + 8 : 0, opacity: expanded ? 1 : 0 }}>
                    <div className="flex flex-col pl-3 pb-2">
                      {subcats.map(c => (
                        <Link key={c.id} href={`${l.href}?category=${c.slug}`} onClick={() => setMenuOpen(false)}
                          className="py-1.5 text-[12px] tracking-[0.08em] text-[#5a4a3a] hover:opacity-50 transition-opacity font-serif">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <nav className="flex flex-col px-5 pt-4">
          {secondaryLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="py-3 text-[13px] tracking-[0.1em] text-[#3a2e22] hover:opacity-50 transition-opacity font-serif">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Section: Socials + Static Logo */}
        <div className="mt-auto px-5 pb-8">
            <div className="flex items-center gap-4 mb-6 text-[#3a2e22]">
                {SOCIALS.map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                      className="hover:opacity-50 transition-opacity">
                        <s.Icon className="w-4 h-4" />
                    </a>
                ))}
            </div>
            <Link href="/" onClick={() => setMenuOpen(false)} className="block relative w-[120px] h-[40px]">
                <Image src="/logo.png" alt="Taylor Vade" fill className="object-contain" />
            </Link>
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

            <p className="text-center text-[12.5px] tracking-[0.12em] text-[#3a2e22] mb-2 font-serif">Ship To:</p>
            <div className="relative mb-5">
              <select value={country} onChange={e => {
                  const next = e.target.value;
                  setCountry(next);
                  const suggestedCurrency = COUNTRY_TO_CURRENCY[next];
                  if (suggestedCurrency) setCurrency(suggestedCurrency);
                }}
                className="w-full border border-[#3a2e22] bg-[#FAF9F7] px-4 py-2.5
                  text-[12.5px] text-center tracking-[0.06em] text-[#3a2e22] font-serif
                  appearance-none outline-none cursor-pointer">
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>

            <p className="text-center text-[12.5px] tracking-[0.12em] text-[#3a2e22] mb-2 font-serif">View Currency In:</p>
            <div className="relative mb-6">
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full border border-[#3a2e22] bg-[#FAF9F7] px-4 py-2.5
                  text-[12.5px] text-center tracking-[0.06em] text-[#3a2e22] font-serif
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

            <div className="text-center text-[11.5px] tracking-[0.06em] text-[#3a2e22] leading-loose mb-6 font-serif">
              <p>Free Delivery Over {formatConverted(FREE_SHIPPING_THRESHOLD_NGN, currency, fxRates)}</p>
              <p>Global Shipping Available</p>
              <p>Secure International Checkouts</p>
            </div>

            <div className="text-center">
              <button onClick={handleUpdatePreferences}
                className="text-[12.5px] tracking-[0.12em] text-[#3a2e22] font-serif
                  underline underline-offset-4 hover:opacity-50 transition-opacity">
                Update Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} initialQuery={search} />

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCountChange={setCartCount}
        initialTab={cartTab}
      />
    </>
  );
}