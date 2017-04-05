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

## Deployment

```
Startseite:

 https://www.example.com:8080/test/pfad/index.html (index.html: optional)
 \___/   \_____________/ \__/\___________________/ 
   |            |         |             |            
Schema⁺        Host      Port          Pfad      
       
API:

 https://www.example.com:8080/test/pfad/api_name?method=request_id
 \___/   \_____________/ \__/\________/\_______/\________________/
   |            |         |       |         |           |
Schema⁺        Host      Port    Pfad      API        Query

```
*Angepasst von [https://de.wikipedia.org/wiki/Uniform_Resource_Locator](https://de.wikipedia.org/wiki/Uniform_Resource_Locator)*

Wenn man das Spiel auf einem Server auf einem bestimmten Pfad (Beispiel: /test/pfad/) hochladen will, dann muss man:

* In IntelliJ:
    * auf "Run" -> Edit Configurations gehen
    * im Dialog, der sich dann öffnet, den Reiter "Deployment" auswählen
    * Navigationsspiel:war exploded auswählen
    * rechts bei "Application context" /test/pfad/ angeben
* In der JS-Anwendung: In der Datei "index.html" in Z. 40 angeben: var WEBROOT = "/test/pfad";

Den api_name kann man wie folgt ändern:

* In IntelliJ:
    * Datei web/WEB-INF/web.xml öffnen
    * bei &lt;servlet-mapping&gt; als url-pattern /api_name/* angeben.
* In der JS-Anwendung: In der Datei "index.html" in Z. 41 angeben: var NAVIGAME_API = "/api_name";

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

Wenn man den Pfad vom Startpunkt zum Zielpunkt fertig erzeugt hat, dann kann man auf den "Submit Path"-Knopf drücken, um eine Bewertung zu erhalten. Hierfür generiert der Server einen zufälligen Wert zwischen 0 und 99. Das muss also noch implementiert werden.

#### CanvasManager

Der CanvasManager ist als Zwischenstufe zwischen den verwendeten Canvas-Framework (Fabric) und der Anwendung zu verstehen, der aber durchaus anwendungsspezifische "View-Logik" beinhaltet (und deswegen z.B. davon ausgeht, dass sich immer ein Bild im Hintergrund befindet).
Damit alle Koordinaten immer relativ zur Karte sind, was bei der Auswertung vermutlich hilfreich sein wird, befinden sich alle Objekte in einer fabric.Group. Darin ist ein weißer Hintergrund, auf den die Karte kommt, und wiederum darauf kommen alle Marker und Edges, die angelegt werden. Das erfordert die Transformation von Canvas-Koordinaten in Karten-(bzw. Gruppen-)Koordinaten bei der Eingabe, sorgt aber wie gesagt dafür, dass die Positionen relativ zum Zentrum der Karte alle immer gleich bleiben.
Da Fabric standardmäßig viel (und für diese Anwendung zu viel) Manipulation der Objekte erlauben, ist sie vollständig deaktiviert. Man kann Objekte also nicht direkt über die vom Framework bereitgestellten Punkte manipulieren. Stattdessen wird ein unsichtbarer Kreis auf die Karte gezeichnet; wenn dieser in die Nähe eines Markers oder der Route kommt, dann wird eine Kollision damit erkannt.

#### MapControls

Die MapControls sind einerseits für die vier kleinen Knöpfe auf der Karte verantwortlich; ihr Hauptzweck ist jedoch das Empfangen von Mouse- und Touch-Events für die Karte. Dafür kreieren sie ein `<div>`, das über dem Canvas liegt, immer gleichgroß ist wie der Canvas und alle dieser Events abfängt. Diese werden dann an den CanvasManager weitergeleitet.
In den MapControls befindet sich der Großteil der "Interaktionslogik" der Anwendung, z.B. auch die Touch-Gesten-Interaktion mit Hammer.JS. Die MapControls entscheiden, wann die Karte gedreht, verschoben oder skaliert wird. Sie kommunizieren dabei mit den MarkerControls und EdgeControls, die Informationen über die Ergebnisse von Mouse-Events erhalten (z.B. ob ein Marker gedrückt wurde oder bei einem mouseover berührt wurde).

#### PathManager

Der PathManager ist eine zentrale Logikkomponente. Er erfährt, wenn bestimmte Sachen in den View-Komponenten passieren, z.B. wenn Marker erzeugt werden. Alle Änderungen im View gibt er an das "Model" weiter; es gibt immer eine View-Repräsentation aller Objekte und eine Model-Repräsentation. Marker und Edges erhalten im View Metadaten zugewiesen, unter anderem den Timestamp ihres Erstellungszeitpunkts, und derselbe Zeitpunkt ist auch im Model hinterlegt. So kann man immer bestimmen, welche Objekte zusammengehören.
Der PathManager hat die wichtige Aufgabe, zu entscheiden, wie der Pfad gespeichert wird, z.B. auf welche Karte (im Model) neue Marker kommen. Edges werden immer aus dem Model heraus angelegt, der PathManager teilt dann dem View mit, dass es eine Kante zwischen zwei Markern geben soll.

### Server

Die Serverkomponente ist im Verlgeich zum JS-Teil des Projekts nicht allzu umfangreich. Neben lambda-Ausdrücken, die ganz unten in diesem Dokument beispielhaft erklärt werden, gibt es nur eine nennenswerte Eigenheit:

Bei Aufrufen an die API landen alle Anfragen zunächst an der gleichen Stelle, nämlich beim `de.ur.iw.navigame.server.AppServlet`, noch konkreter: dessen `handleRequest`-Methode. Alle API-Aufrufe benötigen außerdem als Parameter den `method`-Key, z.B.:

`<server>:<port>/<pfad>/<api>?method=request_id`

Das `AppServlet` entscheidet basierend auf dieser `method`, welche Serverkomponente die Anfrage verarbeit. Dafür werden in der `contextInitialized`-Methode, die automatisch aufgerufen wird, wenn der Server hochfährt, `ServletRequestHandler` registriert. Für jede mögliche `method` muss ein solcher Handler registriert werden. In der `handleRequest`-Methode des `AppServlet`s werden dann Http-Anfragen an die entsprechenden Handler weitergeleitet.

Vom Funktionsumfang her macht die Serverkomponente ansonsten nicht viel; sie lädt nach Anfragen vom Client Daten vom urwalking-server herunter und gibt sie (nach bestimmten Verarbeitungsschritten) an den Client weiter. Wenn die Daten bereits heruntergeladen wurden, so werden sie nicht nochmal geladen. Deswegen kann es sein, dass beim erstmaligen Auswählen eines bestimmten Areals bei der Kartenauswahl eine längere Ladezeit auftritt, weil erst die lange xml-Datei vom urwalking-Server heruntergeladen wird. Bei weiteren Anfragen ist diese bereits da und muss nicht mehr geladen werden.

## Allgemeine Hinweise und Konventionen - Wichtig für Codeverständnis und die Weiterentwicklung

### Klassen

Die App verwendet keine neuen ES6-Ausdrücke wie "class". Stattdessen werden Klassen mit dem [IIFE-Pattern](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression) umgesetzt:

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

### Events

Da sich nicht alle Komponenten gegenseitig kennen sollten, rufen manche nicht direkt die Methoden anderer Komponenten auf, sondern lösen Events aus, um Zustandsänderungen zu kommunizieren. Das sieht meistens so aus:

```javascript
    // ...
    $(this).trigger('eventName', [param1, param2]);
    //
```

Eine andere Komponente kann sich zuvor darauf registriert haben:

```javascript
    // das "this" aus dem vorherigen Block ist das Objekt "someObject", und "this" ist hier etwas anderes:
    // ...
    let that = this;
    $(someObject).on('eventName', function(e, param1, param2) { that.someCallbackFunc(param1, param2); });
    //...

```

`e` wird automatisch erzeugt, ist aber eigentlich (bei dieser Art von Ereignis) nie besonders hilfreich. Die Parameter müssen beim `trigger`-Aufruf als Array übergeben werden. Ein gutes Beispiel ist der PathManager: Er registriert sich in seiner `_registerListeners`-Methode (Z. 343) z.B. auf das 'markerCreated'-Event der MarkerControls:

```javascript
    PathManager.prototype._registerListeners = function () {
        let that = this;

        $(this.markerControls).on("markerCreated", function(event, marker, onEdge) {
            that.addNode(marker.left, marker.top, marker.additionalData, onEdge);
        });
        // ...
    }

```

Die MarkerControls lösen dieses Event aus, nachdem sie einen neuen Marker kreiert haben, in der `_createMarkerAtCanvasPosition`-Methode (Z. 51):


```javascript
    MarkerControls.prototype._createMarkerAtCanvasPosition = function (position) {
        // ...
        $(this).trigger("markerCreated", [newMarker, this._hightlightedRoute]);
        // ...
    }

```

Falls dieses Event-System verwirrend ist: Es spricht meistens nichts dagegen, der Einfachheit halber events auf den `$("body")`-zu registrieren und dort zu triggern. Das kann allerdings zu Problemen führen, wenn sich die gleiche Komponente mehrmals für ein Event registrieren will oder sich von einem Event "abmelden" (s. `unbind`-Methode von jQuery) will; wenn man hier gut aufpasst, dann spricht jedoch prinzipiell nichts dagegen, den body zu verwenden (weil der body immer da ist und praktisch garantiert dasselbe Objekt bleibt).

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

In der `GameApp` werden all diese Templates automatisch in das `compiledTemplates`-Objekt kopiert und dabei auch so übersetzt, dass man sie nachher als Funktion aufrufen kann: `compiledTemplates["map_canvas"]()` Erzeugt den HTML-Code aus dem Template. Aus diesem Code muss man immer noch über jQuery ein Objekt erzeugen oder ihn an ein Objekt anhängen, damit er auf der Seite erscheint - die Template-Funktion generiert letztlich nur eine Zeichenkette.

Man kann in Templates über `<%` und `%>` JS-Code einbauen:

```javascript

templates.test = 
    ['<div id="<%= data.element_id %>">',
     '  <% for (let i = 0; i < data.iterations; i++) { %>',
     '      <span><%= i %></span>',
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

Für Variablen wird meistens "let" statt "var" verwendet ([Erklärung](http://stackoverflow.com/a/11444416)).

Bei der Variablenbenennung bedeutet \_ am Anfang, dass es sich um eine private Variable handelt, und $, dass es sich um ein jQuery-Objekt handelt (\_$abc ist ein privates jQuery-Objekt). Das ist zwar nur eine Konvention (Variablen mit _ davor sind trotzdem öffentlich zugänglich), sollte aber als verbindlich behandelt werden.

Alle Klassen befinden sich im navigame-Namespace, welcher in navigameapp.js definiert wird.


### Server: Lambdas

Im Java-Teil des Projekts werden Consumer<T> verwendet. Diese erlauben es, Funktionen als Parameter zu übergeben und "anonyme" Funktionen zu erstellen.
Angenommen, man möchte eine Funktion aufrufen, wenn ein Prozess, der im Hintergrund läuft (z.B. ein Download), abgeschlossen ist.
Dann könnte man folgendes tun:

```java

public interface DowloadFinishedCallback {
    void onDownloadFinished(String downloadedText);
    void onDownloadError(Exception e);
}

//   ...

public class Download {
    
    public static void startDownload(String url, DownloadFinishedCallback callback) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                //...(download - code)
                    callback.onDownloadFinished(downloadedText);
                } catch (Exception e) {
                    callback.onDownloadError(e);
                }
            }
        }).start();
    }
}

//    ...
//    (in einer anderen Klasse)

    public void downloadFile(String url) {        
        Download.startDownload(url, new DownloadFinishedCallback() {
            @Override
            public void onDownloadFinished(String downloadedText) {
                // do something
            }

            @Override
            public void onDownloadError(Exception e) {
                // do something else
            }
        });
    }

```

Mit Lambda-Ausdrücken kann man das Interface einfach weglassen und genauso das Runnable vereinfachen:

```java

public class Download {
    
    public static void startDownload(String url, Consumer<String> onSuccess, Consumer<Exception> onError) {
        new Thread(() -> { // <- lambda-Ausdruck 1: Runnable nicht notwendig; "leerer" Consumer!
            try {
            //...(download - code)
                onSuccess.accept(downloadedText);
            } catch (Exception e) {
                onError.accept(e);
            }
        }).start();
    }
}

//    ...
//    (in einer anderen Klasse)

    public void downloadFile(String url) {       
        Download.start(url,
            downloadedText -> { // <- lambdas für onSuccess...
                // do something
            },
            exception -> {      // <- ... und onError
                // do something
            });
    }

```

Andere lambda-Konzepte von Java 8 (z.B. Predicates) kommen nicht vor.
Die "->"-Ausdrücke werden automatisch in Consumer übersetzt; mit der "accept"-Methode ruft man die Methoden auf.
