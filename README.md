# Tezara | Tez Arama ve Metaveri Analizi Platformu: [tezara.org](https://tezara.org)

Tezara, YÖK Ulusal Tez Merkezi'ne girilen tezler üzerinden arama ve metaveri analizi yapmanızı sağlar. Yazar, başlık, özet, danışman, yıl, üniversite ve dil gibi verilere ulaşabilir, bu verileri filtreleyebilir ve tablo ya da grafiğe dönüştürerek topluca indirebilirsiniz.

![Tezara Ana Sayfa Filtreler](https://bucket.tezara.org/mockups/home_filters.png)

Tezara'da YÖK'ün sisteminden farklılıkları şu şekilde:

(🟢 = Yapıldı, 🟡 = Yapılacak)

- 🟢 Arama sonuçlarını, özetler dahil topluca CSV tablo ve JSON olarak indirebilirsiniz (YÖK sistemindeki 2000 tez sınırına takılmadan).

- 🟢 Her tezin metaveri sayfasına sadece tez no kullanarak `tezara.org/theses/{Tez No}` adresinden ulaşabilirsiniz. Örneğin: [tezara.org/theses/146683](https://tezara.org/theses/146683). Bu tez sayfalarından bir önceki ya da bir sonraki teze gidebilir, bu teze benzeyen tezleri sayfanın alt tarafında görebilirsiniz.

- 🟢 YÖK'ün sisteminin aksine Tezara'nın tüm fonsiyonları mobil cihazlarda da kolay kullanılabilir.

- 🟢 Gelişmiş filtreleme yapabilir, sonucun linkini kaydedip daha sonra tekrar inceleyebilirsiniz. Örneğin aşağıdaki link Yalova, Cairo veya Umm al-Qura üniversitelerinde yapılmış, Arapça veya İngilizce, yüksek lisans veya doktora tezlerini görüntülemekte:
  - [Gelişmiş Arama Örneği](<https://tezara.org/search?languages=Arap%C3%A7a,%C4%B0ngilizce&thesis-types=Doktora,Y%C3%BCksek+Lisans&universities=Umm+al-Qura+University,Cairo+University+(%D8%AC%D8%A7%D9%85%D8%B9%D8%A9+%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9),Yalova+%C3%9Cniversitesi&advanced=true>)

- 🟢 Her üniversitenin kendi tezlerinin ve istatistiklerinin olduğu sayfalara `tezara.org/universities/{Üniversite Adı}` adresinden ulaşabilirsiniz. Örneğin: [tezara.org/universities/Yalova Üniversitesi](https://tezara.org/universities/Yalova%20%C3%9Cniversitesi).

- 🟢 Tüm üniversitelerin istatistiklerinin bulunduğu dizine şuradan ulaşabilirsiniz: [tezara.org/universities](https://tezara.org/universities)

- 🟢 YÖK'ün verisi elimden geldiğince temizlenmiştir:
  - Örneğin onların sisteminde şu şekilde bir yazar adı görebilirsiniz: `HURİYE ELÇİNhttp://172.16.2.31:8041/UlusalTezMerkezi/YonetimPaneli/tezDetay.jsp?sira=1215 POLAT`

  - Ya da bu şekilde çok sayıda danışman adı: `null TÜREL SARANLI`, `null A. ERKAN ŞAHMALI`, `null JAMES CARGİLE`

- 🟡 Toplu PDF indirme

- 🟡 Fitreleme özelliklerini manuel olarak kullanmadan, doğal konuşma tarzında arama yapma. Örneğin: "2020 ve 2015 yılları arasında yapılmış, adında sosyoloji geçen yüksek lisans tezleri". Şu linki ziyaret ederek bunun bir örneğini görebilirsiniz: [Tezara doğal arama modu](https://tezara.org/search?q=2020%20ve%202015%20y%C4%B1llar%C4%B1%20aras%C4%B1nda%20yap%C4%B1lm%C4%B1%C5%9F,%20ad%C4%B1nda%20sosyoloji%20ge%C3%A7en%20y%C3%BCksek%20lisans%20tezleri&fcall=true)

Notlar:

- Bu proje, [Dr. Öğr. Üyesi Kemal Demir](https://ubs.yalova.edu.tr/ABPDS/AcademicInformation/BilgiGoruntulemev2/Index?pid=U2bdP510gBlFktL3iVOXsQ!xGGx!!xGGx!) hocanın "İnsan Kaynakları Yönetimi ve Uygulamaları" dersinin final ödevini yaparken 3500 tezi filtreleyip indirmem gerekmesi sebebiyle geliştirilmiştir.

- Proje'nin YÖK ile herhangi bir bağlantısı yoktur.

---

![Tezara Arama Sonucu](https://bucket.tezara.org/mockups/search.png)
![Tezara Üniversite Sayfası](https://bucket.tezara.org/mockups/university.png)

---

# Tezara | Thesis Search and Metadata Analysis Platform: [tezara.org](https://tezara.org)

Tezara allows you to search and analyze metadata from the theses entered into the YÖK National Thesis Center. You can access data such as author, title, abstract, advisor, year, university, and language. You can filter this data, convert it to a table or graph, and download in bulk.

![Tezara Homepage with Filters](https://bucket.tezara.org/mockups/home_filters.png)

The differences between Tezara and YÖK's system are as follows:

(🟢 = Done, 🟡 = To Do)

- 🟢 You can download search results, including abstracts, in bulk as a CSV table and JSON (without the restriction of 2000 thesis in YÖK's system).

- 🟢 You can access the page for each thesis at `tezara.org/theses/{Thesis ID}` only using the thesis' ID. For example: [tezara.org/theses/146683](https://tezara.org/theses/146683). On these pages, you can navigate to the next or the previous thesis. You can also see similar thesis at the bottom of the page.

- 🟢 Unlike YÖK's system, all functions of Tezara can be easily used on mobile devices.

- 🟢 You can do advance filtering and save the resulting URL for later. The example below displays the results of the following search: Masters' or PhD thesis that are in English or Arabic and made by the students of Yalova, Cairo or Umm al-Qura universities:
  - [Example of Advanced Search](<https://tezara.org/search?languages=Arap%C3%A7a,%C4%B0ngilizce&thesis-types=Doktora,Y%C3%BCksek+Lisans&universities=Umm+al-Qura+University,Cairo+University+(%D8%AC%D8%A7%D9%85%D8%B9%D8%A9+%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9),Yalova+%C3%9Cniversitesi&advanced=true>)

- 🟢 You can access each university's own page with their theses and statistics at `tezara.org/universities/{University Name}`. For example: [tezara.org/universities/Yalova Üniversitesi](https://tezara.org/universities/Yalova%20%C3%9Cniversitesi).

- 🟢 There is a directory which includes statistical summaries for each university: [tezara.org/universities](https://tezara.org/universities)

- 🟢 I cleaned YÖK's data to the best of my ability:
  - In their sistem, you can see author names like this: `HURİYE ELÇİNhttp://172.16.2.31:8041/UlusalTezMerkezi/YonetimPaneli/tezDetay.jsp?sira=1215 POLAT`

  - Or advisor names like this: `null TÜREL SARANLI`, `null A. ERKAN ŞAHMALI`, `null JAMES CARGİLE`

- 🟡 Bulk PDF download

- 🟡 You can search in natural language without manually using the filtering features. For example: "Master's theses made between 2020 and 2015, and including sociology in the name". You can see an example of this by visiting this link: [Tezara natural search mode](https://tezara.org/search?q=2020%20ve%202015%20y%C4%B1llar%C4%B1%20aras%C4%B1nda%20yap%C4%B1lm%C4%B1%C5%9F,%20ad%C4%B1nda%20sosyoloji%20ge%C3%A7en%20y%C3%BCksek%20lisans%20tezleri&fcall=true)

Notes:

- This project was developed due to a need to filter and download 3500 theses while doing the final assignment of the course "Human Resources Management and Applications" by [Assistant Professor Kemal Demir](https://ubs.yalova.edu.tr/ABPDS/AcademicInformation/BilgiGoruntulemev2/Index?pid=U2bdP510gBlFktL3iVOXsQ!xGGx!!xGGx!).

- The project has no association with YÖK.

---

![Tezara Search Result](https://bucket.tezara.org/mockups/search.png)
![Tezara University Page](https://bucket.tezara.org/mockups/university.png)
