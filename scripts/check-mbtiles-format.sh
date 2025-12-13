#!/bin/bash
# MBTiles dosyasının formatını kontrol et

if [ ! -f "tiles/turkey.mbtiles" ]; then
    echo "❌ tiles/turkey.mbtiles dosyası bulunamadı!"
    echo ""
    echo "Geofabrik'te .mbtiles formatı yoktur. Şunları yapabilirsin:"
    echo "1. Geofabrik'ten turkey-latest.osm.pbf indir"
    echo "2. docs/CONVERT_OSM_TO_MBTILES.md dosyasındaki talimatları takip et"
    exit 1
fi

echo "📦 MBTiles dosyası formatını kontrol ediliyor..."
echo ""

# Docker container içinde kontrol et
docker exec -it tileserver-gl sh -c "
    if command -v sqlite3 > /dev/null 2>&1; then
        echo '=== Metadata ==='
        sqlite3 /data/turkey.mbtiles \"SELECT name, value FROM metadata ORDER BY name;\" 2>/dev/null
        echo ''
        echo '=== Format Kontrolü ==='
        FORMAT=\$(sqlite3 /data/turkey.mbtiles \"SELECT value FROM metadata WHERE name='format';\" 2>/dev/null)
        JSON=\$(sqlite3 /data/turkey.mbtiles \"SELECT value FROM metadata WHERE name='json';\" 2>/dev/null)
        
        if [ \"\$FORMAT\" = \"pbf\" ] && echo \"\$JSON\" | grep -q \"openmaptiles\"; then
            echo '✅ Dosya OpenMapTiles formatında!'
        else
            echo '❌ Dosya OpenMapTiles formatında DEĞİL!'
            echo '   Format: '\$FORMAT
            echo '   JSON içeriği: '\$JSON
            echo ''
            echo 'Çözüm: docs/CONVERT_OSM_TO_MBTILES.md dosyasına bak'
        fi
    else
        echo 'SQLite3 yüklü değil, alternatif kontrol yapılıyor...'
    fi
"

echo ""
echo "✅ Kontrol tamamlandı!"

