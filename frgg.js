/**
 * Pages loader for applications
 * @param views: a list of views names to be injected
 * @param container: application container
 * @param options: app container and loading options etc
 */
function Frgg(views, container, options) {
    var f = this
    var mappings = new Object()
    var container = container || window

    if (!options) options = {}
    var options = {
        appContainer: options.appContainer || 'app',
        autoAttach: options.autoAttach || true,
        manualMappings: options.manualMappings || false
    }

    f.prototype = {
        /**
         * Init the class with data
         */
        init() {
            var ff = this
            if (views && (views instanceof Array)) {
                views.forEach((v) => {
                    var name = v.charAt(0).toUpperCase() + v.substring(1)
                    ff[name] = new Function()
                    if (options.autoAttach) ff.attach(name)
                })
            }
            return ff
        },

        /**
         * Attach page to templates definitions and set to load it when called
         * @param page: the page name
         * @param mapping: path to specific template file
         */
        attach(page, mapping) {
            var ff = this
            var name = page.charAt(0).toLowerCase() + page.substring(1)
            var map = 'templates/pages/_' + name + '.frgg'

            if (options.manualMappings) {
                if (mapping) {
                    map = mapping
                }
            }
            mappings[page] = map

            var _p = new Proxy(ff, {
                get(target, property, receiver) {
                    switch(property) {
                        case page:
                            return (params) => {
                                // arguments accessible, after all!
                                if (params) {
                                    Object.keys(params).forEach((key) => {
                                        container[key] = params[key]
                                    })
                                }
                                ff.loadPage(page)

                                // here you can still invoke the original method, of course
                                target['_' + property].apply(ff, params)
                            }
                            break
                    }
                    return target['_' + property]
                }
            })

            Object.defineProperty(this, page, {
                get: () => {
                    return _p[page]
                },
                set: (val) => {
                    this['_' + page] = val
                }
            })
        },

        /**
         * Load the page template
         * @param page: the page name
         */
        loadPage(page) {
            // get app element
            appContainer = document.getElementsByTagName(options.appContainer)[0]

            // import frigga template
            if (appContainer) appContainer.innerHTML = load(mappings[page]) || ''
        }
    }

    return f.prototype.init()
}

// Load all automatically
(function() {
    /**
     * Add function to String class
     */
    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.split(search).join(replacement);
    }

    /**
     * Load file from an url and returns a string with its content
     * @param url: the url to fetch data.
     */
    load = function(url) {
        var xhr;
        if(this.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if(this.ActiveXObject) {
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
            return setup(xhr.responseText);
        }
        return false;
    }

    /**
     * Find variables in text
     * @param text: the text to find variables in
     */
    findVars = function(text) {
        tList = text.split('{{') || [];
        tList.forEach(function(t) {
            tt = t.split('}}') || [t];
            tt.forEach(function(_t) {
                if (text.includes('{{' + _t + '}}')) {
                    _tt = _t.trim().split('.');
                    _var = this;
                    for(i = 0; i < _tt.length; i++) {
                        if (_var[_tt[i]]) _var = _var[_tt[i]];
                    }
                    if ((_var !== null) && (_var !== undefined)) {
                        text = text.replaceAll(
                            '{{' + _t + '}}',
                            _var
                        );
                    }
                }
            });
        });
        return text;
    }

    /**
     * Find translation marks in text
     * @param text: the text to find translation marks in
     */
    translate = function(text) {
        tList = text.split('__(\'') || [];
        tList.forEach(function(t) {
            tt = t.split('\')') || [t];
            tt.forEach(function(_t) {
                if (text.includes('__(\'' + _t + '\')')) {
                    _lang = this['_language'] || {};
                    _var = _lang[_t];
                    if ((_var !== null) && (_var !== undefined)) {
                        text = text.replaceAll(
                            '__(\'' + _t + '\')',
                            _var
                        );
                    } else {
                        text = text.replaceAll(
                            '__(\'' + _t + '\')',
                            _t
                        );
                    }
                }
            });
        });
        return text;
    }

    /**
     * Function to be used for translation in code
     * @param text: teh text to be translated
     */
    this['__'] = function(text) {
        return translate('__(\'' + text + '\')');
    }

    /**
     * Setup variables and translations
     * @param text: the frgg template to be evaluated
     */
    setup = function(text) {
        text = findVars(text)
        text = translate(text)
        return text;
    }

    /**
     * Remove Frigga scripts after all is done
     * @param scripts: a list with all scripts in page to analyse
     */
    cleanup = function() {
        // remove frigga references
        var scripts = document.getElementsByTagName('script');
        for(i = 0; i < scripts.length; i++) {
            if(scripts[i].type == 'text/frigga') {
                parent = scripts[i].parentNode;
                parent.removeChild(scripts[i]);
            }
        }

        // remove empty divs
        var div = document.getElementsByTagName('div');
        for(i = 0; i < div.length; i++) {
            if (div[i].innerHTML == '') {
                parent = div[i].parentNode;
                parent.removeChild(div[i]);
            }
        }
    }

    /**
     * Compiles the text/frigga templates and add to page
     */
    compileTemplates = function() {
        var scripts = document.getElementsByTagName('script');
        var i, src = [], elem;

        // find for frigga scripts
        for(i = 0; i < scripts.length; i++) {
            if(scripts[i].type == 'text/frigga') {

                // create new element
                elem = document.createElement('div');
                parent = scripts[i].parentNode;
                parent.insertBefore(elem, scripts[i]);

                // import frigga script into
                if(scripts[i].src) {
                    elem.innerHTML = load(scripts[i].src);
                } else {
                    elem.innerHTML = scripts[i].innerHTML;
                }

                // put it all raw int html file in right position
                while (elem.firstChild) {
                    elem.parentNode.insertBefore(elem.firstChild, elem);
                }
            }
        }
        // clean that mess
        cleanup();
    }

    // compile
    compileTemplates();
})();