# Navigationsspiel: Projekt- und Codedokumentation

## Zusammenfassung

Dieses Dokument erklärt, wie das Navigationsspiel grundsätzlich aufgebaut ist und wo Erweiterungen angefügt werden können.

## Dependencies

Auf der JS-Seite sind alle Bibliotheken mit abgegeben. Eine Installation ist nicht notwendig, es wird kein node.js etc. verwendet. Alles ist "oldschool" integriert, also in der .html-Datei referenziert, nicht via require.js o.ä. eingebunden.
Folgende Bibliotheken werden verwendet:

* [jQuery 2.2.4](http://jquery.com/) für diverse Zwecke (Selektoren, Events, ...)
* [Foundation 6](http://foundation.zurb.com/sites/docs/) als Design-Grid
* [jQuery UI 1.7](https://jqueryui.com/) für einfaches Styling und Drag&Drop-Funktionalität
* [lodash](https://lodash.com/) als Templating-Bibliothek
* [Fabric JS](http://fabricjs.com/docs/) als HTML-Canvas-API
* [Hammer.JS](http://hammerjs.github.io/getting-started/) für Touch-Gesten-Unterstützung

Für die Anpassung und Erweiterung sind vor allem Verständnis von jQuery und Fabric JS notwendig. Man sollte außerdem wissen, was [ajax](https://www.w3schools.com/xml/ajax_intro.asp) (bzw. zur Verwendung in jQuery [hier](http://api.jquery.com/jquery.ajax/)) ist.

Auf der Java-/Tomcat-Seite passiert ohnehin recht wenig. Hier braucht man grundsätzliches Verständnis von Java-Server-IO und Webservern allgemein.

## Architektur

Die App hat keine strikte Trennung von Darstellung und Logik, wobei schon angestrebt wurde, die Bestandteile einigermaßen austauschbar zu halten.
Die Darstellung wird zum Großteil entweder durch Templates erzeugt oder von Fabric / dem Canvas übernommen, das grundlegende HTML-Gerüst der index.html ist also wenig aussagekräftig. Der Einstiegspunkt des Programms ist die startGame-Methode der GameApp (navigameapp.js).

CanvasManager

MapVisuals

MapControls

MarkerControls



## Allgemeine Hinweise und Konventionen - Wichtig!

Die App verwendet keine neuen JS6-Ausdrücke wie "class". Für Variablen wird meistens "let" statt "var" verwendet ([Erklärung](http://stackoverflow.com/a/11444416)). Stattdessen werden Klassen so gemacht:

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
     * [_privateMethod ist nicht wirklich privat - das ist auch nur eine Konvention!]
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

Singletons benutzen eher die AMD-Syntax:

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


[Dieses Beispiel](http://embed.plnkr.co/4Mx9AW/) ist zwar auf russisch, erklärt aber trotzdem einigermaßen, wie underscore- oder lodash-Templates funktionieren (vermutlich etwas besser als die [Dokumentation](https://lodash.com/docs/4.17.4#template)).

Von der Variablenbenennung bedeutet _ am Anfang, dass es sich um eine private Variable handelt, und $, dass es sich um ein jQuery-Objekt handelt (_$... ist ein privates jQuery-Objekt).
