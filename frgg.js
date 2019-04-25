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
        manualMappings: options.manualMappings || true
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
        attach(page, mapping, appCont) {
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
                                    container['params'] = params
                                    Object.keys(params).forEach((key) => {
                                        container[key] = params[key]
                                    })
                                }
                                ff.loadPage(page, document.getElementsByTagName(appCont || options.appContainer)[0])

                                // here you can still invoke the original method, of course
                                if (target && (target['_' + property])) target['_' + property](params)
                            }
                            break
                    }
                    return target['_' + property] || null
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
         * Attach many pages at once
         * @param att: Attaches mappings references
         */
        attachAll(att) {
            var ff = this
            Object.keys(att).forEach((key) => {
                ff.attach(key, att[key][0], att[key][1])
            })
        },

        /**
         * Load the page template
         * @param page: the page name
         */
        loadPage(page, appContainer) {
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
                    _origT = _t;
                    _v = undefined;
                    if (_t.includes('||')) {
                        __t = _t.split('||');
                        _t = __t[0];
                        _v = __t[1];
                    }
                    _tt = _t.trim().split('.');
                    _var = this;
                    for(i = 0; i < _tt.length; i++) {
                        if (_var[_tt[i]] && !(_var[_tt[i]] instanceof Node)) _var = _var[_tt[i]];
                    }
                    if ((_var !== null) && (_var !== undefined) && (_var !== this)) {
                        if ((_v !== null) && (_v !== undefined) && (_var instanceof String)) {
                            text = text.replaceAll(
                                '{{' + _origT + '}}',
                                _v
                            );
                        } else {
                            text = text.replaceAll(
                                '{{' + _origT + '}}',
                                _var
                            );
                        }
                    } else {
                        if ((_v !== null) && (_v !== undefined)) {
                            text = text.replaceAll(
                                '{{' + _origT + '}}',
                                _v
                            );
                        }
                    }
                }
            });
        });
        return text;
    }

    /**
     * Find loop syntax in text
     * @param text: the text to find loop in
     */
    findLoop = function(text) {
        __t = '';
        s1 = '{%';
        s2 = '%}';

        /**
         * Process code to loop inside var
         * @param code: the code line to recognize var and keyword
         * @param cont: container to put variables
         * @param txt: the text template to apply variables
         */
        process = function(code, cont, txt) {
            res = '';
            _c = code.trim().split(' ');
            if (_c[0] === 'for') {
                if (cont[_c[3]]) {
                    if (cont[_c[3]] instanceof Array) {
                        cont[_c[3]].forEach(function(_cc) {
                            cont[_c[1]] = _cc;
                            res = res + findVars(txt);
                        });
                        return res;
                    }
                } else {
                    if (_c[3].includes('.')) {
                        __cc = _c[3].split('.');
                        c_ = cont;

                        __cc.forEach(function(c__) {
                            c_ = c_[c__];
                        });

                        if (c_ instanceof Array) {
                            c_.forEach(function(_cc) {
                                cont[_c[1]] = _cc;
                                res = res + findVars(txt);
                            });
                            return res;
                        }
                    }
                }
            }
            return txt;
        }

        tList = text.split(s1) || [];
        tList.forEach(function(t) {
            tt = t.split(s2) || [t];
            tt.forEach(function(_t) {
                if (_t.includes('=>')) {
                    _tt = _t.trim().split('=>');
                    _var = this;
                    if (_tt.length > 1) {
                        __t = __t + process(_tt[0], _var, _tt[1]);
                    }
                } else {
                    __t = __t + _t;
                }
            });
        });
        return (__t === '') ? text : __t;
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
        text = findLoop(text)
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