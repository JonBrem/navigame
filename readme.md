# Navigationsspiel: Projekt- und Codedokumentation

## Zusammenfassung

Dieses Dokument erklärt, wie das Navigationsspiel grundsätzlich aufgebaut ist und wo Erweiterungen angefügt werden können.

## Dependencies

Auf der JS-Seite sind alle Bibliotheken mit abgegeben. Eine Installation ist nicht notwendig, es wird kein node.js etc. verwendet. Alles ist "oldschool" integriert, also in der .html-Datei referenziert, nicht via z.B. require.js eingebunden.
Folgende Bibliotheken werden verwendet:

* [jQuery 2.2.4](http://jquery.com/) für diverse Zwecke (Selektoren, Events, ...)
* [Foundation 6](http://foundation.zurb.com/sites/docs/) als Design-Grid
* [jQuery UI 1.7](https://jqueryui.com/) für einfaches Styling und Drag&Drop-Funktionalität
* [lodash](https://lodash.com/) als Templating-Bibliothek
* [Fabric JS](http://fabricjs.com/docs/) als HTML-Canvas-API
* [Hammer.JS](http://hammerjs.github.io/getting-started/) für Touch-Gesten-Unterstützung

Für die Anpassung und Erweiterung sind vor allem Verständnis von jQuery und Fabric JS notwendig. Man sollte außerdem wissen, was [ajax](https://www.w3schools.com/xml/ajax_intro.asp) (bzw. zur Verwendung in jQuery [hier](http://api.jquery.com/jquery.ajax/)) ist.

Serverseitig macht die Anwendung nicht viel, außer dem Client Daten zur Verfügung zu stellen, und hat nur den Tomcat-Server und JSON als Dependencies (die sind auch im Projekt direkt enthalten). Eine Auswertung des clientseitig erzeugten Pfades o.ä. findet noch nicht statt.

## Architektur

### JS

In diesem Punkt werden die Funktionen des Spiels beschrieben, sowie die Klassen, die für sie zuständig sind. Das soll einen Überblick vermitteln, wo man bei der Weiterentwicklung ansetzen kann, wenn man einen bestimmten Punkt überarbeiten will.

#### Übersicht

Die App hat keine strikte Trennung von Darstellung und Logik, wobei schon angestrebt wurde, die Bestandteile einigermaßen austauschbar zu halten.
Die Darstellung wird zum Großteil entweder durch Templates erzeugt oder von Fabric / dem Canvas übernommen, das grundlegende HTML-Gerüst der index.html ist also wenig aussagekräftig. Der Einstiegspunkt des Programms ist die startGame-Methode der GameApp (navigameapp.js).

Darin wird (nach allen anderen Elementen) ein NewGameDialog erzeugt und angezeigt. Darin kann man eine Session-ID aus einem vorherigen Spiel laden oder ein neues Spiel starten, wofür dem Server eine Anfrage geschickt wird, dass er eine neue Session-ID und einen Start- und Zielpunkt anlegen soll.

Dann wird unmittelbar ein MapSelectionDialog erzeugt, auf dem man zunächst das grobe Areal und dann eine Karte/Etage in diesem Areal auswählt. Wenn man sich für eine Karte entschieden hat, so kann man diesen Dialog beenden. Die Karte wird zur Liste von Karten (unten auf dem Bildschirm) hinzugefügt und über die MapVisuals auf den Canvas geladen, der nur dem CanvasManager zugänglich ist. Dieser hat seinen eigenen Unterpunkt, da er etwas komplexer ist. Über die MapControls (die ebenfalls in einem eigenen Unterpunkt genauer erklärt werden) kann man die Karte verschieben, rotieren und skalieren.

Wenn man den Punkt bei der "Marker hinzufügen"-Fläche auf die Karte zieht, so wird an der entsprechenden Stelle ein neuer  **Marker** erzeugt. Auf der Logikebene erfährt dies der PathManager, der einen **Node** anlegt. Diese Begriffe sind mehr oder weniger Synonym zu verstehen (Marker heißen die Teile, die in Google Maps Zielpunkte anzeigen; Nodes ist der Begriff aus der Graphentheorie). Wenn man den zweiten (3., 4., ...) Marker anlegt, so sieht man, dass die Marker automatisch mit **Routen** (oder **Edges**) verbunden werden.

Marker kann man per Drag & Drop verschieben, die Routen / Edges wandern automatisch mit. Wenn man Marker löscht, indem man sie anklickt und dann auf den Roten Knopf drückt), dann wird eine ihrer anliegenden Edges gelöscht und die andere verbindet ihren Vorgänger mit ihrem Nachfolger. Man kann "Zwischenpunkte" einfügen, indem man einen Marker direkt auf eine Route zieht. Über den Bearbeiten-Knopf kann man Markern und Edges Daten hinzufügen.

Der PathManager kümmert sich immer darum, dass die visuelle Repräsentation und die Logikrepräsentation des Graphen, den man so erzeugt, identisch sind. Marker werden hier als PathNodes bezeichnet, Routen als PathEdges. Diese befinden sich auf MapPaths, also den Teilstücken des Pfades, die auf einer Karte dargestellt sind. Die MapPaths bilden zusammen den Path.

Unten auf der Seite kann man über den "Add Map"-Knopf neue MapPaths anlegen, dadurch wird wieder ein MapSelectionDialog erzeugt, auf dem man eine neue Karte anlegen kann. Karten lassen sich auch per Drag & Drop verschieben.

Wenn man den Pfad vom Startpunkt zum Zielpunkt fertig erzeugt hat, dann kann man auf den "Submit Path"-Knopf drücken, um eine Bewertung zu erhalten.

#### CanvasManager

Der CanvasManager ist als Zwischenstufe zwischen den verwendeten Canvas-Framework (Fabric) und der Anwendung zu verstehen, der aber durchaus anwendungsspezifische "View-Logik" beinhaltet (und deswegen z.B. davon ausgeht, dass sich immer ein Bild im Hintergrund befindet).
Damit alle Koordinaten immer relativ zur Karte sind, was bei der Auswertung vermutlich hilfreich sein wird, befinden sich alle Objekte in einer fabric.Group. Darin ist ein weißer Hintergrund, auf den die Karte kommt, und wiederum darauf kommen alle Marker und Edges, die angelegt werden. Das erfordert die Transformation von Canvas-Koordinaten in Karten-(bzw. Gruppen-)Koordinaten bei der Eingabe, sorgt aber wie gesagt dafür, dass die Positionen relativ zum Zentrum der Karte alle immer gleich bleiben.
Da Fabric standardmäßig viel (und für diese Anwendung zu viel) Manipulation der Objekte erlauben, ist sie vollständig deaktiviert. Man kann Objekte also nicht direkt über die vom Framework bereitgestellten Punkte manipulieren. Stattdessen wird ein unsichtbarer Kreis auf die Karte gezeichnet; wenn dieser in die Nähe eines Markers oder der Route kommt, dann wird eine Kollision damit erkannt.

#### MapControls

abc

#### PathManager

Der PathManager ist eine zentrale Logikkomponente.
abc

### Server

Der Server hat eine eigene Java-Dokumentation.


## Deployment

IntelliJ: Run -> Edit Configurations -> Reiter "Deployment" -> Navigationsspiel:war exploded ->
    rechts bei "Application context" "/irgend/ein/pfad" angeben

    dann ist das Spiel unter http://[server]/irgend/ein/pfad/index.html verfügbar.

index.html, WEBROOT

IntelliJ: (bzw. Projektordner):

    Navigationsspiel -> web -> WEB-INF -> web.xml, Z. 14: /navigame_api/*

index.html, NAVIGAME_API = "/navigame_api"


## Allgemeine Hinweise und Konventionen - Wichtig für Codeverständnis die Weiterentwicklung

abc

### Klassen

Die App verwendet keine neuen ES6-Ausdrücke wie "class". Für Variablen wird meistens "let" statt "var" verwendet ([Erklärung](http://stackoverflow.com/a/11444416)). Stattdessen werden Klassen mit dem [IIFE-Pattern](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression) umgesetzt:

```javascript
var Klasse = (function () {

    function Klasse(params) {
        this.publicMember = null;
        // nicht wirklich privat - ist nur eine Konvention!
        this._privateMember = null;
    }

    Klasse.prototype.publicMethod = function () {
        console.log(this._privateMember);
    }; 

    /**
     * _privateMethod ist nicht wirklich privat - das ist auch nur eine Konvention!
     */
    Klasse.prototype._privateMethod = function () {
    };

    return Klasse;
}());

```
Dadurch kann man nun die Schreibweise `let a = new Klasse();` verwenden. Man muss ggf. aufpassen, dass Methoden, die als Callbacks übergeben werden, ein anderes `this` haben:

Das funktioniert nicht:

```javascript
   Klasse.prototype._doSomething = function () {
        this._$someMember.on("mousedown", _onMouseDown);
    };

    Klasse.prototype._onMouseDown = function(e) {
        console.log(this._someValue);
        // "this" ist hier _nicht_ die Instanz der Klasse!
        // _onMouseDown wird allerdings schon aufgerufen.
    };

```

Das funktioniert:

```javascript
   Klasse.prototype._doSomething = function () {
        let that = this;
        this._$someMember.on("mousedown", function(e) {that._onMouseDown(e);});
    };

    Klasse.prototype._onMouseDown = function(e) {
        console.log(this._someValue);
        // "this" ist hier die Instanz der Klasse!
    };

```

### Singletons

Singletons benutzen folgende Syntax:

```javascript

var Log = (function() {
    
    let that = {},

    somePublicFunc = function() {

    },

    _somePrivateFunc = function() {

    };

    that.someFunc = somePublicFunc;
    return that;
}());

```
... und werden dann wie folgt aufgerufen: `Log.someFunc();`

### \_-Templates

[Dieses Beispiel](http://embed.plnkr.co/4Mx9AW/) ist zwar auf russisch, erklärt aber trotzdem einigermaßen, wie underscore- oder lodash-Templates funktionieren (vermutlich etwas besser als die [Dokumentation](https://lodash.com/docs/4.17.4#template)).
Templates sind HTML-Codes in String-Form, die man dynamisch erzeugen und mit Daten befüllen kann.

Ein kurzer eigener Erklärungsversuch ist folgender:

```javascript

templates.map_canvas = 
       ['<div class="small-12 columns">',
        '   <canvas width="500" height="500" id="my_canvas"></canvas>',
        '</div>'].join('\n');

```

In der `GameApp` werden all diese Templates automatisch in das `compiledTemplates`-Objekt kopiert und dabei auch so übersetzt, dass man sie nachher als Funktion aufrufen kann: `compiledTemplates["map_canvas"]()` Erzeugt den HTML-Code aus dem Template. Diesen Code muss man immer noch über jQuery erzeugen oder an ein Objekt anhängen, damit er auf der Seite erscheint.

Man kann in Templates über `<%` und `%>` JS-Code einbauen:

```javascript

templates.test = 
    ['<div id="<%= data.element_id %>">',
     '  <% for (let i = 0; i < data.iterations; i++) { %>',
     '      <span>i</span>',
     '  <% } %>',
     '</div>'].join('\n');

```

würde durch den Aufruf `compiledTemplates["test"]({data: {element_id: "hey", iterations: 3}})` folgenden Code erzeugen:

```html

<div id="hey">
      <span>0</span>  
      <span>1</span>
      <span>2</span>
</div>

```

Alle templates befinden sich im Ordner view_templates. Es gibt eigentlich keinen Grund, sie für Objekte zu verwenden, die einmalig erzeugt werden, außer dass die "Haupt"-HTML-Datei nicht so überfrachtet wird.
Bei Erweiterungen der Anwendung könnte man also dieses System verwenden oder auch nicht. Allerdings muss man ggf. darauf achten, dass die bestehenden Klassen ihre Template-Inhalte nicht zwingend an die bestehenden Container-Divs anhängen, sondern ihren Inhalt auch überschreiben könnten.

### Benennungskonventionen

Von der Variablenbenennung bedeutet \_ am Anfang, dass es sich um eine private Variable handelt, und $, dass es sich um ein jQuery-Objekt handelt (_$... ist ein privates jQuery-Objekt). Das ist zwar nur eine Konvention (Variablen mit _ davor sind trotzdem öffentlich zugänglich), sollte aber als verbindlich behandelt werden.

Alle Klassen befinden sich im navigame-Namespace, welcher in navigameapp.js definiert wird.
