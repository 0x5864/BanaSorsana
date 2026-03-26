# BanaSorsana

BanaSorsana, yerel olarak çalışan hafif bir web projesidir.

Projede şu bölümler yer alır:

- Anasayfa kartları
- Adres kodu ve posta kodu sorgulama aracı
- Çoklu birim dönüştürücü kartları
- Anasayfadan açılan popup araçları

## Proje Yapısı

- `index.html`: Anasayfa
- `adres.html`: Adres kodu ve posta kodu aracı
- `donusturucu.html`: Tüm dönüştürücü kartları
- `styles.css`: Ortak stil dosyası
- `adres.js`: Adres sayfası davranışları
- `donusturucu.js`: Dönüştürücü hesaplamaları
- `home.js`: Anasayfa popup davranışları
- `server.mjs`: Yerel sunucu ve proxy

## Yerel Olarak Çalıştırma

Bu proje şu anda `8010` portu üzerinden kullanılacak şekilde hazırlanmıştır.

Sunucuyu başlat:

```bash
node server.mjs
```

Tarayıcıda aç:

```text
http://127.0.0.1:8010/index.html
```

## Sayfalar

- Anasayfa: `http://127.0.0.1:8010/index.html`
- Adres: `http://127.0.0.1:8010/adres.html`
- Dönüştürücü: `http://127.0.0.1:8010/donusturucu.html`

## Kısa Notlar

- `Adres` sayfası UAVT ve posta kodu akışı için hazırlanmıştır.
- `Ağırlık` aracı anasayfada popup olarak açılır.
- Dönüştürücü kartları anasayfada da popup olarak kullanılabilir.
- Bazı dış veri akışları için `server.mjs` içindeki proxy gereklidir.

## GitHub

Repo adresi:

`https://github.com/0x5864/BanaSorsana`
