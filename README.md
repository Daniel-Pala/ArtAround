# ArtAround

Web Technologies course project, academic year 2025/26, University of Bologna.

A museum audio guide made of two applications. The **marketplace** is where curators write content about the artworks and assemble tours, and where visitors buy them. The **navigator** is the application used inside the museum: it shows or reads aloud the texts at the chosen level and length, answers voice commands, shows the map and recognises the QR codes placed next to the artworks.

## How it is built

```
backend/       Node.js, Express, MongoDB and Socket.io: the API, the real-time guided
               tour, and serving the files of the two applications
marketplace/   HTML, CSS and JavaScript with no framework, one page per feature
navigator/     React and Vite
```

In production a single Express process serves everything: the API under `/api`, the marketplace at the root and the compiled navigator under `/navigator`.

## Running locally

You need Node.js 22 and a MongoDB database.

**Backend.** Inside `backend/`, copy `.env.example` to `.env` and fill it in: the MongoDB connection string, any string as `JWT_SECRET`, and a key from a provider compatible with the OpenAI API for the three `AI_*` lines (the default is Google Gemini).

```
cd backend
npm install
node seed.js        # wipes the database and fills it with sample data
npm run dev         # port 3000
```

The marketplace is at `http://localhost:3000/login.html`.

**Navigator.** In a second terminal:

```
cd navigator
npm install
npm run dev         # port 5173, forwards /api calls to the backend on 3000
```

The navigator is at `http://localhost:5173`. Voice commands need Chrome or Safari: Firefox has no speech recognition.

## Sample accounts

After `node seed.js`, all with password `12345678`:

| user | role |
| --- | --- |
| `autore1`, `autore2` | curators: they write items and assemble tours |
| `visitatore1` | has already bought the public tours of both museums |
| `visitatore2` | has not bought anything yet |

## Documentation

The API routes are described in [API.md](API.md).
