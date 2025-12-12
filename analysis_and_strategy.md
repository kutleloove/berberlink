# BerberLink - Proje Analizi, Öneriler ve Strateji Belgesi

## 1. Proje Özeti ve Hedefler
BerberLink, kullanıcıların berberlerden randevu almasını ve doğrudan iletişim kurmasını sağlayan, "Bionluk" veya "Armut" benzeri bir pazar yeri (marketplace) platformudur.

**Temel Hedefler:**
*   **Kişiselleştirilmiş Deneyim:** Her berberin kendine özel, teması değiştirilebilir bir profil sayfası (`berberlink.com/berberadi`) olacak.
*   **Özel Alan Adı (Custom Domain):** Berberler kendi alan adlarını (örn: `berberahmet.com`) sisteme bağlayarak kendi markalarıyla hizmet verebilecekler.
*   **Gerçek Zamanlı Etkileşim:** Socket.io ile anlık mesajlaşma ve canlı randevu müsaitliği.
*   **Yönetim Kolaylığı:** İşletmeler için randevu, mesaj ve müşteri (kara liste) yönetimi.

## 2. Teknik Analiz ve Mimari

### Teknoloji Yığını (Tech Stack)
*   **Frontend & Backend Framework:** Next.js (App Router yapısı ile modern ve SEO dostu).
*   **Veritabanı:** PostgreSQL. İlişkisel veritabanı yapısı randevu ve kullanıcı ilişkileri için idealdir.
*   **ORM (Object-Relational Mapping):** Prisma veya Drizzle ORM. (Tip güvenliği ve geliştirme hızı için).
*   **Gerçek Zamanlı İletişim:** Socket.io.
    *   *Not:* Next.js Serverless ortamında (Vercel vb.) Socket.io kalıcı bağlantılarını yönetmek zordur. Bu nedenle proje için **Custom Server (Node.js + Next.js)** veya **Ayrı bir Socket Sunucusu** mimarisi önerilir.
*   **Stil ve UI:** Tailwind CSS ve Shadcn/UI (Hızlı ve özelleştirilebilir bileşenler için).
*   **State Management:** TanStack Query (Server state) ve Zustand (Client state).

### Veritabanı Tasarımı (Taslak)
1.  **Users (Kullanıcılar):** Müşteriler ve Berberler için ortak temel tablo (role: customer | admin | barber).
2.  **Profiles (Berber Profilleri):** `slug` (berberadi), `theme_config` (renkler, fontlar), `bio`, `location` vb.
3.  **Services (Hizmetler):** Saç kesimi, sakal tıraşı, süreleri ve fiyatları.
4.  **Appointments (Randevular):** Tarih, saat, durum (pending, confirmed, cancelled), müşteri_id, berber_id.
5.  **Messages (Mesajlar):** Gönderen, alıcı, içerik, timestamp (Socket.io ile senkronize).
6.  **Blacklist (Kara Liste):** Berberin engellediği kullanıcılar.

## 3. Öneriler ve Kritik Noktalar

### 3.1. Dinamik Routing ve Tema (berberlink.com/berberadi)
*   Next.js Dynamic Routes (`app/[slug]/page.tsx`) kullanılmalı.
*   **Middleware ile Multi-tenancy:** Gelen isteğin `host` başlığına (header) bakılarak, isteğin ana platformdan mı (`berberlink.com`) yoksa özel bir alan adından mı (`berberahmet.com`) geldiği tespit edilmeli. Özel alan adı ise, arka planda ilgili berberin `slug` içeriği sunulmalı (Rewrite).
*   Veritabanında her berber için bir `theme_preference` JSON alanı tutulmalı.
*   Sayfa yüklendiğinde bu konfigürasyona göre CSS değişkenleri (CSS Variables) güncellenerek sayfa rengi ve fontu dinamik değiştirilmeli.

### 3.2. Gerçek Zamanlı Altyapı (Socket.io)
*   Randevu alındığı anda berberin ekranına bildirim düşmeli.
*   Mesajlaşma anlık olmalı.
*   **Strateji:** Next.js'i custom server (server.js) ile başlatarak Socket.io'yu aynı portta dinletmek en performanslı ve maliyet etkin çözüm olacaktır (VPS dağıtımı gerektirir).

### 3.3. Randevu Mantığı
*   Çakışmaları önlemek için veritabanı seviyesinde "Transaction" kullanılmalı.
*   "En yakın tarihli randevu" gösterimi için PostgreSQL indexlemesi ve optimize edilmiş sorgular şart.

## 4. Geliştirme Stratejisi (Yol Haritası)

### Faz 1: Altyapı ve Kimlik Doğrulama
*   Next.js projesinin kurulumu.
*   PostgreSQL ve ORM (Prisma/Drizzle) kurulumu.
*   Authentication (Auth.js veya Clerk) entegrasyonu. Rol bazlı (Müşteri vs Berber) giriş yapısı.

### Faz 2: Berber Profili ve Yönetim Paneli
*   Berberlerin kayıt olup `slug` (URL) belirlemesi.
*   **Custom Domain Entegrasyonu:** DNS doğrulama ve domain bağlama altyapısı.
*   Hizmetlerin tanımlanması.
*   Profil sayfası tasarımı ve dinamik tema altyapısının kurulması.

### Faz 3: Randevu Sistemi
*   Müsaitlik takvimi oluşturma.
*   Müşterinin randevu alması ve veritabanı kayıtları.
*   Berberin randevuyu onaylaması/reddetmesi.

### Faz 4: Socket.io ve Mesajlaşma
*   WebSocket sunucusunun kurulması.
*   Anlık mesajlaşma arayüzü.
*   Real-time bildirimler (Yeni randevu geldiğinde sesli uyarı vb.).

### Faz 5: Güvenlik ve Kara Liste
*   Berberin kullanıcıyı kara listeye alması.
*   Middleware ile kara listedeki kullanıcının randevu almasının veya mesaj atmasının engellenmesi.

## 5. UI Tasarımı, UX Deneyimi ve Sayfa Yapıları

### 5.1. UI/UX Prensipleri
*   **Mobile-First:** Randevuların büyük çoğunluğu mobilden alınacağı için tüm tasarımlar önce mobil ekranlar düşünülerek yapılmalı.
*   **Sürtünmesiz (Frictionless) Randevu:** Kullanıcı (Müşteri) sayfaya girdiği anda "Randevu Al" butonunu görmeli. Üyelik zorunluluğu randevu adımının sonuna saklanabilir veya "Misafir" olarak devam etme opsiyonu sunulabilir.
*   **Temiz ve Odaklı Arayüz:** Berberin işlerini (fotoğraflarını) ve müsaitlik durumunu ön plana çıkaran, gereksiz detaylardan arındırılmış bir tasarım.
*   **Güven Hissi:** Berber puanı, yorumlar ve daha önce yapılan işlerin galerisi görünür olmalı.

### 5.2. Sayfa Listesi ve Layout Analizi

#### A. Platform Sayfaları (berberlink.com)
1.  **Landing Page (Ana Sayfa):**
    *   *Amaç:* Berberleri sisteme üye olmaya ikna etmek ve kullanıcıların berber araması.
    *   *İçerik:* Hero (Slogan + Arama Çubuğu), Özellikler (Randevu, SMS, Site Kurma), Fiyatlandırma, Footer.
2.  **Login / Register (Auth):**
    *   *Layout:* Basit, ortalanmış form yapısı. Berber ve Müşteri ayrımı (Tab veya ayrı butonlar).

#### B. Berber Web Sitesi (berberlink.com/slug veya berberahmet.com)
Bu sayfalar berberin seçtiği temaya (Renk, Font) göre şekillenecektir.
1.  **Berber Ana Sayfası (Public Profile):**
    *   *Header:* Logo, Menü (Hizmetler, Galeri, İletişim), "Randevu Al" (CTA).
    *   *Hero:* Berber dükkanından bir fotoğraf, slogan, çalışma saatleri özeti.
    *   *Hizmetler Listesi:* Fiyatları ve süreleriyle birlikte hizmet kartları.
    *   *Galeri:* Instagram entegrasyonu veya yüklenen fotoğraflar.
    *   *Yorumlar:* Müşteri geri bildirimleri slider'ı.
    *   *Footer:* Adres, harita, sosyal medya ikonları.
2.  **Randevu Sihirbazı (Booking Flow):**
    *   *Adım 1:* Hizmet Seçimi (Çoklu seçim yapılabilir).
    *   *Adım 2:* Personel Seçimi (Opsiyonel, eğer birden fazla koltuk varsa).
    *   *Adım 3:* Tarih ve Saat Seçimi (Müsaitlik takvimi).
    *   *Adım 4:* Özet ve Onay (Telefon doğrulama veya giriş).

#### C. Yönetim Panelleri (Dashboard)
1.  **Berber Paneli:**
    *   *Layout:* Sol Sidebar (Menü), Sağ İçerik Alanı.
    *   *Sayfalar:*
        *   **Takvim:** Günlük/Haftalık görünüm. Sürükle-bırak ile randevu taşıma.
        *   **Randevular:** Liste görünümü, onaylama/iptal butonları.
        *   **Müşteriler:** Müşteri listesi, geçmiş randevular, notlar, kara liste butonu.
        *   **Ayarlar:** Dükkan bilgileri, çalışma saatleri, **Alan Adı Ayarları**, Tema Düzenleyici.
2.  **Müşteri Paneli:**
    *   *Layout:* Daha basit, üst menülü yapı.
    *   *Sayfalar:*
        *   **Randevularım:** Gelecek ve geçmiş randevular.
        *   **Favori Berberlerim:** Hızlı erişim.
        *   **Ayarlar:** Profil ve bildirim tercihleri.

## 6. Sonuç
Bu proje, modern web teknolojileri ile ölçeklenebilir bir SaaS (Software as a Service) potansiyeli taşımaktadır. Özellikle özelleştirilebilir berber sayfaları ve **kendi alan adını kullanabilme imkanı**, işletmeleri platforma çekmek için güçlü bir değer önerisidir.

