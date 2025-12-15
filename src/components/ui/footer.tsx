import Link from "next/link";
import { Scissors, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo ve Açıklama */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-white text-slate-900 p-1.5 rounded-lg">
                <Scissors size={24} />
              </div>
              <span className="text-2xl font-bold">BerberLink</span>
            </Link>
            <p className="text-slate-300 mb-4 max-w-md">
              Berberler için modern ve kullanıcı dostu randevu yönetim sistemi. 
              Müşterileriniz kolayca randevu alabilir, siz de randevularınızı verimli bir şekilde yönetebilirsiniz.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-slate-300 hover:text-white transition-colors">
                  Berber Ara
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="text-slate-300 hover:text-white transition-colors">
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-slate-300 hover:text-white transition-colors">
                  Kayıt Ol
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="text-slate-300 hover:text-white transition-colors">
                  Berber Hesabı Oluştur
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-slate-300">
                <Mail size={18} className="mt-0.5 flex-shrink-0" />
                <a href="mailto:info@berberlink.com" className="hover:text-white transition-colors">
                  info@berberlink.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-slate-300">
                <Phone size={18} className="mt-0.5 flex-shrink-0" />
                <a href="tel:+905551234567" className="hover:text-white transition-colors">
                  +90 (555) 123 45 67
                </a>
              </li>
              <li className="flex items-start gap-2 text-slate-300">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <span>İstanbul, Türkiye</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt Kısım */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} BerberLink. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Kullanım Şartları
            </Link>
            <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
              İletişim
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


