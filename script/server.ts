/*
     Website ...: LoP
     Autor .....: Axel Schumann
     Datum .....: 2021-12-08

     Website für eine Liste offener Punkte (LoP) mit Wiedervorlage

     Version:
     0.001 ....: 2021-12-08
     - Client Version mit einfacher Funktionalität
     1.001 ....: 2021-12-13
     - Client-Server Version mit einfacher Funktionalität
       - CREATE, READ, UPDATE, DELETE (CRUD)
       - SAVE (Einfacher Ersatz einer Datenbank durch eine JSON-Datei)
       - Version (Abfrage der Programmversion)
*/

import * as express from "express";  // express bereitstellen
const fs = require('fs'); // Zugriff auf Dateisystem

// ----------------------------------------------------------------------------
// Klassen
class LopEintrag {
    /* Klasse zur Abbildung eines Eintrags in der LoP (Liste offener Punkte). Jeder
       Eintrag in der LoP wird durch ein Objekt (Instanz) dieser Klasse gebildet.
     */
    public besitzer: string;
    public aufgabe: string;
    public datum: Date;
    private status: number; // 0 = nicht definiert, 1 = aktiv, 2 = deaktiviert, 3 = gelöscht
    private readonly id: number; // eindeutige und unveränderliche id eines Eintrags
    private static id_max: number = 0; // größte bisher vergebene id
    private static stack: LopEintrag[] = [];  // Stack für alle erzeugten Einträge

    constructor(besitzer: string, aufgabe: string, datum: Date, status: number) {
        this.id = ++LopEintrag.id_max;  // Vergabe einer eindeutigen id
        this.status = status;
        this.besitzer = besitzer;
        this.aufgabe = aufgabe;
        this.datum = new Date(datum);
        LopEintrag.stack.push(this); // Der aktuelle Eintrag wird zur Sicherung auf den Stack gelegt
    }

    getID(): number {
        // Ermittlung der id des rufenden Eintrags
        return this.id;
    }

    getStatus(): number {
        // Ermittlung des Status des rufenden Eintrags
        return this.status;
    }

    setStatus(status: number): number {
        // Setzen des Status des rufenden Eintrags
        this.status = status;
        return this.status;
    }

    static getLoPEintragStack(): LopEintrag[] {
        // Rückgabe des vollständigen Stacks mit allen Einträgen
        return LopEintrag.stack;
    }
}

class LoP {
    /* Klasse zur Abbildung einer LoP (Liste offener Punkte).
       Die LoP enthält eine Liste mit Einträgen von Objekten der Klasse LopEintrag.
     */
    public liste: LopEintrag[];  // Liste der eingetragenen Elemente
    private static stack: LoP[] = []; // Stack aller LoPs (im vorliegenden Fall ist nur
                                      // ein Element in diesem Stack enthalten
    constructor() {
        this.liste = [];
        LoP.stack.push(this);
    }

    public getLopEintrag(id: number): LopEintrag {
        let lop_act: LopEintrag = undefined;
        for (let i of this.liste) {
            if (id === i.getID()) {
                lop_act = i;
            }
        }
        return lop_act;
    }
}

class LogLoP {
    public besitzer: string;
    public aufgabe: string;
    public datum: Date;
    public status: number;

    constructor(besitzer: string, aufgabe: string, datum: Date, status: number) {
        this.besitzer = besitzer;
        this.aufgabe = aufgabe;
        this.datum = datum;
        this.status = status;
    }
}

// ----------------------------------------------------------------------------
// Funktionen

function loPSave(loP: LoP, file: string): string {
    // Sichern der übergebenen LoP in die Datei mit dem Pfad file.
    // Der gespeicherte JSON-String wird von der Funkion zurückgegeben

    // Aufbau des JSONs mit der LoP als Objekt der Klasse LogLoP
    const logLoP: LogLoP[] = [];
    for (let i of loP_aktuell.liste) {
        logLoP.push(new LogLoP(i.besitzer, i.aufgabe, i.datum, i.getStatus()));
    }

    // Umwandeln des Objekts in einen JSON-String
    const logLoPJSON = JSON.stringify(logLoP);

    // Schreiben des JSON-Strings der LoP in die Datei mit dem Pfadnamen "file"
    fs.writeFile(file, logLoPJSON, (err) => {
        if (err) throw err;
        if (logRequest)
            console.log("LoP gesichert in der Datei: ", file);
    });
    return logLoPJSON;
}

function renderLoP(LoP: LoP): string {
    // Aufbereitung der aktuellen LoP als HTML-tbody

    let html_LoP: string = "";
    for (let i in LoP.liste) {
        // Ein Element der LoP wird nur ausgegeben, wenn sein Status auf aktiv (1) steht.
        if (LoP.liste[i].getStatus() === 1) {
            let id = LoP.liste[i].getID();
            let besitzer = LoP.liste[i].besitzer;
            let aufgabe = LoP.liste[i].aufgabe;
            let datum = LoP.liste[i].datum;
            let datum_string = datum.toISOString().slice(0, 10);
            html_LoP += "<tr class='b-dot-line' data-lop-id='" + id + "'>"
            html_LoP += "<td class='click-value' data-purpose='besitzer' " +
                "data-lop-id='" + id + "'>" + besitzer + "</td>";
            html_LoP += "<td class='click-value as-width-100pc' data-purpose='aufgabe' " +
                "data-lop-id='" + id + "'>" + aufgabe + "</td>";
            html_LoP += "<td class='click-value' data-purpose='datum'" +
                " data-lop-id='" + id + "'>" + datum_string + "</td>";
            html_LoP += "</tr>"
        }
    }
    return html_LoP;
}

function renderLoPChange(lopChange: LopEintrag): string {
    // Aufbereitung des aktuellen Eintrags für die Änderungs-/Löschausgabe in
    // der zugehörigen Tabellenzeile

    let id_act = lopChange.getID();
    let besitzer = lopChange.besitzer;
    let aufgabe = lopChange.aufgabe;
    let datum = lopChange.datum;
    let html_Change: string = "";

    html_Change += "<td><input type='text' value='" + besitzer + "'></td>" +
        "<td><input class='as-width-100pc' type='text' value='" +
        aufgabe + "'>" +
        "<br>" +
        " <form>" +
        "<input type = 'submit' value = 'ändern' class='as-button-0' " +
        "data-purpose = 'aendern' data-lop-id = '" + id_act + "'>" +
        "<input type = 'submit' value = 'zurück' class='as-button' " +
        "data-purpose = 'zurück' data-lop-id = '" + id_act + "'>" +
        "<input type = 'submit' value = 'löschen' class='as-button' " +
        "data-purpose = 'loeschen' data-lop-id = '" + id_act + "'>" +
        "</form>" +
        "</td>" +
        "<td><input type='text' value='" + datum.toISOString().slice(0, 10) + "'>" +
        "</td>";

    return html_Change;
}

// Globale Variablen ----------------------------------------------------------
let programmname: string = "LoP";
let version: string = 'V.1.001';
let username: string;   // aktuelle Bearbeiterperson
let loP_aktuell: LoP = new LoP();  // LoP anlegen
let loPRunCounter: number = 0;  // Anzahl der Serveraufrufe vom Client

// Debug Informationen über console.log ausgeben
const logRequest: boolean = true;

// ----------------------------------------------------------------------------
// Die aktuelle LoP wird bei jeder Änderung zur Sicherung und Wiederverwendung in
// einer Datei mit eindeutigem Dateinamen gespeichert.
const logRunDate: string = (new Date()).toISOString();
const logLoPFile_work: string = "log/logLoP.json";
const logLoPFile_save_pre: string = "log/logLoP_";

fs.readFile(logLoPFile_work, "utf-8", (err, lopData) => {
    // Einlesen der letzten aktuellen LoP -----------------------------------------
    if (err) {
        // Wenn die Datei nicht existiert, wird eine neue Liste angelegt
        loP_aktuell.liste = [];
    } else {
        // Wenn die Datei existiert, werden die JSON-Daten eingelesen und es wird
        // die letzte aktuelle LoP rekonstruiert.
        const lopDataJSON = JSON.parse(lopData); // JSON aus den eingelesenen Daten
        for (let i of lopDataJSON) {
            // Aus dem JSON die LoP aufbauen
            loP_aktuell.liste.push(
                new LopEintrag(i.besitzer, i.aufgabe, new Date(i.datum), i.status));
        }
    }
    if (logRequest)
        console.log("LoP eingelesen. Anzahl der Einträge: ",
            loP_aktuell.liste.length);
});

// ----------------------------------------------------------------------------
// Aktivierung des Servers
const server = express();
const serverPort: number = 8080;
const serverName: string = programmname + " " + version;
server.listen(serverPort);
console.log("Der Server \"" + serverName + "\" steht auf Port ", serverPort, "bereit",
    "\nServerstart: ", logRunDate);

server.use(express.urlencoded({extended: false})); // URLencoded Auswertung ermöglichen
server.use(express.json()); // JSON Auswertung ermöglichen

// ----------------------------------------------------------------------------
// Mapping von Aliases auf reale Verzeichnisnamen im Dateisystem des Servers

// Basisverzeichnis des Webservers im Dateisystem
let rootDirectory = __dirname;
server.use("/style", express.static(rootDirectory + "/style"));
server.use("/script", express.static(rootDirectory + "/script"));
console.log("root directory: ", rootDirectory);

// ----------------------------------------------------------------------------
// Start der Website auf dem Client durch Übergabe der index.html -------------
server.get("/", (req: express.Request, res: express.Response) => {
    if (logRequest) console.log("GET /");
    res.status(200);
    res.sendFile(rootDirectory + "/html/index.html");
});
server.get("/favicon.ico", (req: express.Request, res: express.Response) => {
    // Hier wird das Icon für die Website ausgeliefert
    if (logRequest) console.log("GET favicon.ico");
    res.status(200);
    res.sendFile(rootDirectory + "/image/cc-icon.ico");
});
server.get("/version", (req: express.Request, res: express.Response) => {
    // Hier wird die Serverversion ausgeliefert
    if (logRequest) console.log("GET version");
    res.status(200);
    res.send(serverName);
});

// ----------------------------------------------------------------------------
// CREATE - Neuer Eintrag in die LoP
server.post("/create", (req: express.Request, res: express.Response) => {
    ++loPRunCounter;
    // Wert vom Client aus dem JSON entnehmen
    const besitzer: string = String(req.body.besitzer);
    const aufgabe: string = String(req.body.aufgabe);
    const datum: Date = new Date(req.body.datum);
    username = besitzer;

    if (logRequest) console.log("Post /create: ", loPRunCounter);

    loP_aktuell.liste.push(new LopEintrag(besitzer, aufgabe, datum, 1));

    // Die aktuelle LoP wird gesichert und in einer
    // Datei (logLoPFile_work) gespeichert. Die Datei wird bei jeder Berechnung wieder
    // mit dem aktuellen Stand der LoP überschrieben.
    loPSave(loP_aktuell, logLoPFile_work);

    // Rendern der aktuellen LoP und Rückgabe des gerenderten Tabellenteils (tbody)
    const html_tbody = renderLoP(loP_aktuell)
    res.status(200);
    res.send(html_tbody);

});

// ----------------------------------------------------------------------------
// READ
server.get("/read", (req: express.Request, res: express.Response) => {
    // READ - Rückgabe der vollständigen LoP als HTML-tbody
    ++loPRunCounter;

    const loP_aktuellLength = loP_aktuell.liste.length;
    if (logRequest) console.log("GET /read: ", loPRunCounter, loP_aktuellLength);

    if (loP_aktuell === undefined) {
        res.status(404)
        res.send("LoP does not exist");

    } else {
        // Rendern der aktuellen LoP
        const html_tbody = renderLoP(loP_aktuell)
        res.status(200);
        res.send(html_tbody);
    }
});
server.post("/read", (req: express.Request, res: express.Response) => {
    // READ -Rückgabe der Tabellenzeile für ändern und löschen
    ++loPRunCounter;

    // Wert vom Client aus dem JSON entnehmen
    const id_act: number = Number(req.body.id_act);

    const lopChange = loP_aktuell.getLopEintrag(id_act);

    if (logRequest) console.log("Post /read: ", loPRunCounter, id_act, lopChange);

    if (loP_aktuell === undefined || lopChange.getStatus() !== 1) {
        res.status(404)
        res.send("Item " + id_act + " does not exist");

    } else {
        // Rendern der aktuellen LoP
        const html_change = renderLoPChange(lopChange);
        res.status(200);
        res.send(html_change);
    }
});

// ----------------------------------------------------------------------------
// UPDATE - LoP-Eintrag ändern
server.post("/update", (req: express.Request, res: express.Response) => {
    // Werte vom Client aus dem JSON entnehmen
    ++loPRunCounter;

    const id_act: number = Number(req.body.id_act);
    const besitzer: string = String(req.body.besitzer);
    const aufgabe: string = String(req.body.aufgabe);
    const datum: Date = new Date(req.body.datum);

    if (logRequest) console.log("GET /update: ", loPRunCounter, id_act);

    const lopUpdate = loP_aktuell.getLopEintrag(id_act);

    if (lopUpdate === undefined || lopUpdate.getStatus() !== 1) {
        res.status(404)
        res.send("Item " + id_act + " does not exist");
    } else {
        lopUpdate.besitzer = besitzer;
        lopUpdate.aufgabe = aufgabe;
        lopUpdate.datum = datum;

        // Sichern der aktuellen LoP in die Datei logLoPFile_work
        loPSave(loP_aktuell, logLoPFile_work);

        // Rendern der aktuellen LoP
        renderLoP(loP_aktuell)
        res.status(200);
        res.send("Item " + id_act + " changed");

    }
    // Rückgabe der Werte an den Client
});

// ----------------------------------------------------------------------------
// DELETE - LoP-Eintrag aus der Liste löschen
server.post("/delete", (req: express.Request, res: express.Response) => {
    // Wert vom Client aus dem JSON entnehmen
    ++loPRunCounter;
    const id_act: number = Number(req.body.id_act);

    const lopDelete = loP_aktuell.getLopEintrag(id_act);

    if (logRequest) console.log("Post /delete: ", loPRunCounter,
        id_act, lopDelete);

    if (lopDelete === undefined || lopDelete.getStatus() !== 1) {
        res.status(404)
        res.send("Item " + id_act + " does not exist");
    } else {
        lopDelete.setStatus(2);

        // Sichern der aktuellen LoP in die Datei logLoPFile_work
        loPSave(loP_aktuell, logLoPFile_work);

        // Rendern der aktuellen LoP und Rückgabe des gerenderten Tabellenteils (tbody)
//        const html_tbody = renderLoP(loP_aktuell)
        res.status(200);
        res.send("Item " + id_act + " deleted");
    }
});

// ----------------------------------------------------------------------------
// SAVE - LoP in Datei mit Datumstempel sichern
server.get("/save", (req: express.Request, res: express.Response) => {
    /* Die aktuelle LoP wird zur Sicherung und Wiederverwendung in einer Datei
       mit eindeutigem Dateinamen mit dem aktuellen Datumsstempel gespeichert.
     */
    ++loPRunCounter;
    if (logRequest) console.log("Get /save: ", loPRunCounter);

    const logRunDate: string = (new Date()).toISOString();
    const logLoPFile_save: string = logLoPFile_save_pre + logRunDate + ".json";

    // Sichern der aktuellen LoP in die Datei logLoPFile_save
    loPSave(loP_aktuell, logLoPFile_save);

    res.status(200);
    res.send("LoP saved");
});

// ----------------------------------------------------------------------------
server.use((req, res) => {
    // Es gibt keine reguläre Methode im Server für die Beantwortung des Requests
    ++loPRunCounter;
    if (logRequest) console.log("Fehler 404", req.url);
    res.status(404);
    res.set('content-type', 'text/plain; charset=utf-8')
    const urlAnfrage: string = req.url;
    res.send(urlAnfrage +
        "\n\nDie gewünschte Anfrage kann vom Webserver \"" + serverName +
        "\" nicht bearbeitet werden!");
});



