// Load all automatically
(function() {
    /**
     * Load file from an url and returns a string with its content
     * @param url: the url to fetch data.
     */
    load = function(url) {
        var xhr;
        if(window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if(window.ActiveXObject) {
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        } else {
            return false;
        }
        xhr.open('GET', url, false);
        if(xhr.overrideMimeType) {
            xhr.overrideMimeType('text/plain');
        }
        xhr.send(null);
        if(xhr.status == 200) {
            return xhr.responseText;
        }
        return false;
    }

    /**
     * Compiles the text/frigga templates and add to page
     */
    compileTemplates = function() {
        var script = document.getElementsByTagName('script');
        var i, src = [], elem;
        for(i = 0; i < script.length; i++) {
            if(script[i].type == 'text/frigga') {
                div = document.createElement('div');
                elem = document.createElement('div');
                parent = script[i].parentNode;
                parent.insertBefore(div, script[i]);
                if(script[i].src) {
                    elem.innerHTML = load(script[i].src);
                    div.appendChild(elem);
                } else {
                    elem.innerHTML = script[i].innerHTML;
                    div.appendChild(elem);
                }
                parent.removeChild(script[i]);
            }
        }
    }

    // compile
    compileTemplates();
})();
