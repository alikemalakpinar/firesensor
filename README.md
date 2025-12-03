### Byte Yapısı (Toplam 56 byte):
- **0. Byte**: START Marker (0xAA, 1 byte)
- **1-4. Byte**: Sıcaklık (Temperature, float, 4 byte)
- **5-8. Byte**: Nem (Humidity, float, 4 byte)
- **9-12. Byte**: Gaz Rezistans (Gas Resistance, float, 4 byte)
- **13-16. Byte**: Hava Kalitesi (Air Quality, float, 4 byte)
- **17-20. Byte**: NO2 (float, 4 byte)
- **21-24. Byte**: CO (float, 4 byte)
- **25-28. Byte**: TVOC (float, 4 byte)
- **29-32. Byte**: eCO2 (float, 4 byte)
- **33-36. Byte**: Yüzey Sıcaklık 1 (Surface Temp 1, float, 4 byte)
- **37-40. Byte**: Yüzey Sıcaklık 2 (Surface Temp 2, float, 4 byte)
- **41-44. Byte**: Basınç (Pressure, float, 4 byte)
- **45-48. Byte**: Akım (Current, float, 4 byte)
- **49. Byte**: Warning2 (1 byte, bit tabanlı anomali)
- **50. Byte**: Warning1 (1 byte, bit tabanlı anomali)
- **51-54. Byte**: Panel Health (float, 4 byte)
- **55. Byte**: END Marker (0x55, 1 byte)

### Örnek Mesaj:
```
0xAA0x422000000x42C800000x43FA00000x41A000000x3F8000000x400000000x404000000x408000000x422000000x422000000x42C800000x3F8000000x010x020x3F8000000x55
```

Bu mesajda:
- Sıcaklık: 40.0°C
- Nem: 100.0%
- Gaz Rezistans: 500.0 ohm
- Hava Kalitesi: 20.0 AQI
- NO2: 1.0 ppm
- CO: 2.0 ppm
- TVOC: 3.0 ppb
- eCO2: 4.0 ppm
- Yüzey Sıcaklık 1: 40.0°C
- Yüzey Sıcaklık 2: 40.0°C
- Basınç: 100.0 hPa
- Akım: 1.0 A
- Warning2: 0x01 (Bit 0: Yüzey Sıcaklık 1 anomalisi)
- Warning1: 0x02 (Bit 1: Nem anomalisi)
- Panel Health: 1.0%

## Parse İşlemi

### 1. MQTT.js'de Parse:
- Mesaj string'i `split('0x')` ile parçalara ayrılır.
- START (0xAA) ve END (0x55) marker'ları kontrol edilir.
- Her hex değer float'a `hexToFloat()` ile dönüştürülür (IEEE 754).
- Warning1 ve Warning2, `hexToByte()` ile byte'a çevrilir, binary'ye dönüştürülür.

### 2. Warning Bit Yapısı:

#### Warning1 (8 bit):
- **Bit 0**: Sıcaklık anomalisi
- **Bit 1**: Nem anomalisi
- **Bit 2**: Gaz Rezistans anomalisi
- **Bit 3**: Hava Kalitesi anomalisi
- **Bit 4**: NO2 anomalisi
- **Bit 5**: CO anomalisi
- **Bit 6**: TVOC anomalisi
- **Bit 7**: eCO2 anomalisi

#### Warning2 (8 bit):
- **Bit 0**: Yüzey Sıcaklık 1 anomalisi
- **Bit 1**: Yüzey Sıcaklık 2 anomalisi
- **Bit 2**: Basınç anomalisi
- **Bit 3**: Akım anomalisi
- **Bit 4-7**: Kullanılmıyor (boş)

### 3. Veritabanı Kaydetme (savedb.py):
- Hex veriler float'a dönüştürülür.
- Warning'lar binary string olarak kaydedilir.
- Tüm veriler MySQL'e INSERT edilir.



