const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs'); // Node.js File System om bestanden te lezen/schrijven
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper om data veilig in te laden uit het JSON-bestand
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Als het bestand nog niet bestaat, maken we een lege database aan
            fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
            return {};
        }
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Fout bij het lezen van data.json:", error);
        return {};
    }
}

// Helper om data veilig op te slaan in het JSON-bestand
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fout bij het schrijven naar data.json:", error);
    }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper om de datum van vandaag als string te krijgen (YYYY-MM-DD)
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// API Route: Haal alle data op voor de kalender en het dashboard
app.get('/api/data', (req, res) => {
    const currentData = readData();
    res.json(currentData);
});

// API Route: Voer de kat (maximaal 2 keer per dag!)
app.post('/api/feed', (req, res) => {
    const todayKey = getTodayKey();
    const { wie, wat } = req.body;
    const currentData = readData();

    if (!currentData[todayKey]) {
        currentData[todayKey] = [];
    }

    // Controleer de harde limiet van 2 maaltijden op deze specifieke dag
    if (currentData[todayKey].length >= 2) {
        return res.status(400).json({ 
            success: false, 
            message: "FRAUDE DETECTIE! De meester heeft vandaag al 2 keer gegeten. Trap niet in die zielige ogen!" 
        });
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Voeg de nieuwe voeding toe aan de lijst van vandaag
    currentData[todayKey].push(`${timeStr} - ${wie} (gaf ${wat})`);
    
    // Sla de bijgewerkte historie direct permanent op
    writeData(currentData);
    
    res.json({ success: true, data: currentData });
});

app.listen(PORT, () => {
    console.log(`Katten server draait op poort ${PORT}`);
});