# ExamIDE

**ExamIDE**, bilgisayar, yazılım ve bilişim sistemleri mühendisliği gibi uygulamalı alanlarda karşılaşılan kağıt üzerinde kod yazma sorunsalını ortadan kaldırmak için doğmuştur. 

Öğrencilerin mezuniyet sonrası iş hayatlarında karşılaşacakları gerçek dünya senaryolarına uygun olarak, bilgisayar destekli, güvenli ve gerçek zamanlı bir online IDE ve sınav yönetim sistemi sunar. Docker izolasyonu sayesinde öğrencilerin kodlarını güvenli bir kapalı ortamda çalıştırır ve "TimeMachine" özelliği ile elektrik kesintisi gibi olası veri kayıplarının önüne geçer.

## Öne Çıkan Özellikler

- **Gerçek Zamanlı Takip:** Admin panelinden tüm öğrencilerin bağlantı durumu, çözdükleri sorular ve o anki ilerlemeleri canlı olarak izlenir.
- **İzole Çalıştırma:** Öğrencilerin gönderdiği her kod parçası (Python, C vb.), ana sisteme zarar vermemesi için izole bir Docker container'ı (Alpine) içinde çalıştırılıp sonuç döndürülür.
- **TimeMachine Yedekleme Modülü:** Elektrik veya internet kesintilerinde "TimeMachine" özelliği devreye girer. Öğrencilerin kodu her 10 saniyede bir veritabanına yedeklenir. Sınav baştan başlasa dahi tüm öğrenciler tam kaldığı noktadan güvenle devam edebilirler.
- **Kişiselleştirilebilir Arayüz:** Uygulama, kullanıcının cihaz veya tarayıcısındaki tema tercihini (aydınlık/karanlık mod) otomatik olarak algılar ve arayüzü buna göre şekillendirir.

---

## Kurulum İçin Gerekli Adımlar

Projeyi donanımınızda çalıştırmadan önce sisteminizde **Docker** ve **Docker Compose**'un yüklü olması zorunludur.

### 1. Konfigürasyon Ayarları

Sistemi ayağa kaldırmadan önce, API URL'lerinin frontend ile backend arasında sorunsuz haberleşebilmesi için küçük port ayarlamaları yapmanız gerekmektedir. 

Proje dizinindeki `.env` dosyasını oluşturun veya düzenleyin:
```env
PORT=5001
BASE_URL="http://127.0.0.1:${PORT}"
```

Aynı port bağlamasını frontend içindeki `config.js` dosyasına da yansıtın:
```javascript
const PORT = 5002;
const CONFIG = {
    BASE_URL: `http://127.0.0.1:${PORT}`,
    API_RUN_URL: `http://127.0.0.1:${PORT}/api/client/run`
};
```
*(Yukarıdaki port numaraları örnektir, sistemin çalışacağı portlara göre `5000` veya belirlediğiniz başka bir port ile senkron edebilirsiniz.)*

### 2. İzolasyon İmajını Yükleme (Docker)
Öğrenci kodlarının güvenle çalıştırılabilmesi için sistemin bir izolasyon imajına ihtiyacı vardır. En yalın ve hızlı imaj olan Alpine Python imajını indirmelisiniz. Terminali açıp aşağıdaki komutu çalıştırın:

```bash
docker pull python:alpine
```

### 3. Uygulamayı Başlatma
Proje dizinindeyken terminale aşağıdaki komutu girerek sistemi ayağa kaldırın:

```bash
docker-compose up -d --build
```
*Bu işlem backend ve frontend servislerini çalıştıracak, `timemachine.db` için gerekli dosya bağlamalarını kuracaktır.*

Sistem ayağa kalktığında:
- **Uygulama Giriş Adresi:** `http://localhost:5000`


## Admin Olarak Giriş Yapma ve Sınav Yönetimi

Sınav sistemine müdahale edebilmek ve sınav dosyası yükleyebilmek için admin (yönetmen) panelinden giriş yapmalısınız.

Normal bir giriş ekranı yerine güvenli bir URL ile admin erişimi sağlanır. Uygulama başlatıldıktan sonra tarayıcınızın adres çubuğuna şu URL'yi girin:

```
http://localhost:5000/api/auth/login?token=exam-admin-secret-7734
```
*Not: Bu token proje ayarlarında belirlenmiş olan standart geliştirici admin token'ıdır.*

### Admin Paneli Özellikleri
- **Sınav Başlatma/Durdurma:** Seçtiğiniz `.json` formatındaki sınav dosyasını yükleyip tek tuşla tüm laboratuvar için sınavı başlatabilirsiniz.
- **TimeMachine Sekmesi:** Program herhangi bir nedenle kapanırsa, tekrar açtığınızda panalde size "Kaydedilmiş Oturum Bulundu" bildirimi gelir. Buradan tüm öğrencileri tek tuşla kurtarıp sınava kaldığı yerden aynen devam ettirebilirsiniz.


## Sınav Dosyası Formatı (.json)

Admin panelinden yükleyeceğiniz sınav soruları belirli bir JSON standartında olmak zorundadır. Aşağıda örnek ve temiz bir sınav dosyası yapısı bulunmaktadır:

```json
{
  "name": "Bilgisayar Mühendisliği - Vize Sınavı",
  "description": "C ve Python kullanabileceğiniz 2 soruluk temel algoritma sınavı.",
  "time": 60,
  "language": "python",
  "questions": [
    {
      "id": 1,
      "title": "İki Sayının Toplamı",
      "description": "Verilen iki sayıyı toplayan bir fonksiyon yazınız.",
      "points": 40,
      "run-time-limit": 2.0,
      "memory-limit": 128,
      "test-cases": [
        {
          "input": "3 5",
          "expected_output": "8"
        },
        {
          "input": "10 20",
          "expected_output": "30"
        }
      ]
    },
    {
      "id": 2,
      "title": "Faktoriyel Hesaplama",
      "description": "Kullanıcıdan alınan sayının faktoriyelini hesaplayın.",
      "points": 60,
      "run-time-limit": 3.0,
      "memory-limit": 256,
      "test-cases": [
        {
          "input": "5",
          "expected_output": "120"
        }
      ]
    }
  ]
}
```

**Anahtar Kelimeler:**
- `key`: Sınavın belirlenen adıdır.
- `time`: Sınav süresi (dakika) cinsindendir.
- `questions`: Soruların listelendiği dizi. Her soru `test-cases` isimli deneme senaryolarını içerir. Sistemin otomatik notlandırması bu test caseler üzerinden yapılır.

## Lisans
Bu proje donanım ve izole ortam araçları kullanılarak eğitim amaçlı geliştirilmiştir. Sorumluluk kullanıcıya aittir.
