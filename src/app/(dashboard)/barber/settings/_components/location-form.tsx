"use client";

import { updateLocation } from "@/actions/settings";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { CITIES, searchOSM } from "@/data/locations";

// Map bileşenini dinamik import ediyoruz (SSR kapalı)
const MapPicker = dynamic(() => import("@/components/ui/map-picker"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400">Harita Yükleniyor...</div>
});

interface LocationFormProps {
  initialAddress: string;
  initialLat: number | null;
  initialLng: number | null;
}

export function LocationForm({ initialAddress, initialLat, initialLng }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Konum State'i
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

  // Adres Parçaları
  const [selectedCityId, setSelectedCityId] = useState<number | "">("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");

  const selectedCity = useMemo(() =>
    CITIES.find(c => c.id === Number(selectedCityId)),
    [selectedCityId]);

  // İl Seçilince
  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    setSelectedCityId(cityId);
    setSelectedDistrict("");

    // Haritayı şehre odakla
    const city = CITIES.find(c => c.id === Number(cityId));
    if (city) {
      const results = await searchOSM(`${city.name}, Türkiye`);
      if (results && results.length > 0) {
        setPosition([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
      }
    }
  };

  // İlçe Seçilince
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setSelectedDistrict(district);

    // Haritayı ilçeye odakla
    if (selectedCity && district) {
      const results = await searchOSM(`${district}, ${selectedCity.name}, Türkiye`);
      if (results && results.length > 0) {
        setPosition([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
      }
    }
  };

  // Mahalle/Sokak blur olduğunda (veya butona basınca) haritada ara
  const handleAddressSearch = async () => {
    if (!selectedCity || !selectedDistrict) return;

    const query = `${street} ${neighborhood}, ${selectedDistrict}, ${selectedCity.name}, Türkiye`;
    const results = await searchOSM(query);

    if (results && results.length > 0) {
      setPosition([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!position) {
      alert("Lütfen haritadan konum seçiniz.");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.set("lat", position[0].toString());
    formData.set("lng", position[1].toString());

    // Tam adresi birleştirip gönderebiliriz veya textarea'daki değeri kullanırız.
    // Kullanıcının textarea'ya yazdığı asıl adres kabul edilir.

    await updateLocation(formData);
    setLoading(false);
    alert("Konum ve adres bilgileri başarıyla kaydedildi.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Adres Seçim Adımları */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">İl Seçimi</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              value={selectedCityId}
              onChange={handleCityChange}
            >
              <option value="">İl Seçiniz</option>
              {CITIES.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">İlçe Seçimi</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedCityId}
            >
              <option value="">Önce İl Seçiniz</option>
              {selectedCity?.districts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mahalle</label>
            <input
              type="text"
              placeholder="Örn: Cumhuriyet Mah."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              onBlur={handleAddressSearch}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sokak / Cadde</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Örn: Atatürk Cad."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                onBlur={handleAddressSearch}
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Haritada Bul"
              >
                <Search size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Sokağı girdiğinizde harita otomatik odaklanacaktır.</p>
          </div>
        </div>

        {/* Textarea ve Harita */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Açık Adres (Detaylı)</label>
            <textarea
              name="address"
              defaultValue={initialAddress}
              required
              placeholder="Bina No, Kat, Daire ve tarif bilgisi..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none h-[142px] resize-none text-slate-900 shadow-sm"
            />
          </div>

          {/* Sadece mobilde görünen uyarı/bilgi */}
          <div className="md:hidden bg-indigo-50 text-indigo-800 text-xs p-3 rounded-lg border border-indigo-100">
            Haritadaki konumu parmağınızla sürükleyerek ayarlayabilirsiniz.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-indigo-600" />
          Harita Konumu
        </label>
        <MapPicker position={position} onPositionChange={setPosition} />
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          disabled={loading}
          className="w-full md:w-auto md:px-12 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : null}
          Konumu ve Ayarları Kaydet
        </button>
      </div>
    </form>
  );
}
