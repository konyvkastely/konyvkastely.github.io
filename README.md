# Könyvkastély

Világos, reszponzív, statikus digitális könyvtár közkincs könyvekhez.

## Funkciók

- keresés szerző, cím és kategória szerint;
- kategóriaszűrők;
- reszponzív megjelenés;
- Internet Archive online olvasó;
- letöltési hivatkozás;
- billentyűzettel is használható felület.

## Helyi megnyitás

A könyvtárat egy egyszerű helyi webszerverrel kell megnyitni. Például:

```text
python -m http.server 8000 --directory konyvkastely-site
```

Ezután: `http://localhost:8000`

## Új könyv hozzáadása

Az `app.js` fájl elején található `books` listához kell új könyvadatot hozzáadni. A kereső és a kategóriaszűrők automatikusan frissülnek.

## Közzététel

A mappa közvetlenül közzétehető GitHub Pagesen. Nem igényel szerveroldali programot vagy fizetős tárhelyet.
