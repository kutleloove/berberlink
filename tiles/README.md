# Vector Tiles (.mbtiles) Dosyaları

Bu klasöre vektör harita verilerini (.mbtiles formatında) koyacaksın.

## ⚠️ ÖNEMLİ: OpenMapTiles Formatı Gerekli

TileServer GL **sadece OpenMapTiles formatındaki** `.mbtiles` dosyalarını destekler. Diğer formatlar çalışmaz!

## Türkiye Haritası İndirme

### ✅ Seçenek 1: Protomaps (Önerilen - Ücretsiz)
1. https://protomaps.com/downloads adresine git
2. **"Turkey"** veya **"Europe"** seçeneğini seç
3. **PMTiles** veya **OpenMapTiles** formatında indir
4. Bu klasöre `turkey.mbtiles` (veya `.pmtiles`) olarak kaydet
5. Docker'ı yeniden başlat: `docker-compose restart`

### ✅ Seçenek 2: Geofabrik + Dönüştürme
1. https://download.geofabrik.de/europe/turkey.html adresinden `turkey-latest.osm.pbf` indir
2. `.osm.pbf` dosyasını OpenMapTiles formatında `.mbtiles`'a dönüştür
3. Detaylar için `docs/FREE_VECTOR_TILES.md` dosyasına bak

### ❌ Seçenek 3: MapTiler (Ücretli)
MapTiler ücretli olduğu için önerilmez ($2500/yıl).

### 🔧 Seçenek 3: Kendi Oluşturma (Gelişmiş)
1. OpenMapTiles tools kullanarak kendi `.mbtiles` dosyanı oluştur
2. Sadece ihtiyacın olan bölgeyi (örneğin Kahramanmaraş çevresi) çıkar
3. **OpenMapTiles** formatında export et

## Dosya Boyutu
- Türkiye tam harita: ~500MB - 2GB (sıkıştırılmış)
- Bölgesel harita: ~50-200MB

## Format Kontrolü

Dosyanın OpenMapTiles formatında olduğunu kontrol etmek için:

```bash
docker exec -it tileserver-gl sh
sqlite3 /data/turkey.mbtiles "SELECT name, value FROM metadata WHERE name='json';"
```

Çıktıda `"format": "pbf"` ve `"json": "openmaptiles"` görünmeli.

## Not
Docker compose çalıştığında bu klasördeki `.mbtiles` dosyası otomatik olarak TileServer GL tarafından okunur.

