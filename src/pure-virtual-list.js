'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by allin_000 on 04.09.2016.
 */

//Если есть необходимость
var Api = function Api(obj) {
    _classCallCheck(this, Api);

    return new Promise(function (resolve, reject) {

        if (!obj) reject(new Error('Haven\'t setting'));

        var request = new XMLHttpRequest();

        request.onload = function () {
            if (obj.statusAcceptence.indexOf(this.status) == 0) {
                resolve({
                    response: this.response,
                    headers: this.getAllResponseHeaders()
                });
            } else {
                reject(new Error(this.statusText));
            }
        };

        request.onerror = function () {
            reject(new Error('XMLHttpRequest Error: ' + this.statusText));
        };

        request.ontimeout = function () {
            reject(new Error('XMLHttpRequest Error: timeout'));
        };

        request.onloadstart = function () {
            if (obj.onloadstart) obj.onloadstart();
        };

        request.onloadend = function () {
            if (obj.onloadend) obj.onloadend();
        };

        request.onprogress = function () {
            if (obj.onprogress) obj.onprogress();
        };

        //XHR settings
        if (obj.timeout) {
            request.timeout = obj.timeout;
        }
        if (!obj.method) {
            obj.method = 'GET';
        }
        request.open(obj.method, obj.url, true);

        if (obj.headers && obj.headers.length) {
            for (var i = 0; i < obj.headers.length; i++) {
                request.setRequestHeader(obj.headers[i].name, obj.headers[i].value);
            }
        }

        obj.body ? request.send(obj.body) : request.send();
    });
};

;

//Если нужно написать тимплейт со своей сериализацией

var ListTemplate = function ListTemplate(template, items) {
    _classCallCheck(this, ListTemplate);

    if (!template) return false;
    var html;
    switch (template) {
        case 'list':
            html = function html(items) {
                return '\n                    <div class="list-group">\n                        ' + items.map(function (item) {
                    return item.name.length > 1 ? '<a href="#action-' + item.guid + '-' + item.email + '-' + item.company + '" class="list-group-item list-group-item-action">' + item.name + '</a>' : '<div class="list-group-item ">' + item.name + '</div>';
                }).join('') + '\n                    </div>\n                ';
            };
            break;

        default:
            console.log('шаблона нету');
            return false;
    }

    return html(items);
};

;

//Виртуал лист.

var VirtualList = function () {
    function VirtualList() {
        _classCallCheck(this, VirtualList);
    }

    _createClass(VirtualList, [{
        key: 'VirtualListConfig',
        value: function VirtualListConfig(config) {
            var width = config && config.w + 'px' || '100%';
            var height = config && config.h + 'px' || '100%';
            var itemHeight = this.itemHeight = config.itemHeight;

            this.items = config.items;
            this.generatorFn = config.generatorFn;
            this.totalRows = config.totalRows || config.items && config.items.length;

            var scroller = this.createScroller(itemHeight * this.totalRows);
            this.container = this.createContainer(width, height);
            this.container.appendChild(scroller);

            var screenItemsLen = Math.ceil(config.h / itemHeight);
            // Cache 4 times the number of items that fit in the container viewport
            this.cachedItemsLen = screenItemsLen * 3;
            this._renderChunk(this.container, 0);

            var self = this;
            var lastRepaintY = void 0;
            var maxBuffer = screenItemsLen * itemHeight;
            var lastScrolled = 0;

            this.rmNodeInterval = setInterval(function () {
                if (Date.now() - lastScrolled > 100) {
                    var badNodes = document.querySelectorAll('[data-rm="1"]');
                    for (var i = 0, l = badNodes.length; i < l; i++) {
                        self.container.removeChild(badNodes[i]);
                    }
                }
            }, 300);

            function onScroll(e) {
                var scrollTop = e.target.scrollTop; // Triggers reflow
                if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > maxBuffer) {
                    var first = parseInt(scrollTop / itemHeight) - screenItemsLen;
                    self._renderChunk(self.container, first < 0 ? 0 : first);
                    lastRepaintY = scrollTop;
                }

                lastScrolled = Date.now();
                e.preventDefault && e.preventDefault();
            }

            this.container.addEventListener('scroll', onScroll);
        }
    }, {
        key: 'createRow',
        value: function createRow(i) {
            var item = void 0;
            if (this.generatorFn) item = this.generatorFn(i);else if (this.items) {
                if (typeof this.items[i] === 'string') {
                    var itemText = document.createTextNode(this.items[i]);
                    item = document.createElement('div');
                    item.style.height = this.itemHeight + 'px';
                    item.appendChild(itemText);
                } else {
                    item = this.items[i];
                }
            }

            item.classList.add('vrow');
            item.style.position = 'absolute';
            item.style.top = i * this.itemHeight + 'px';
            return item;
        }
    }, {
        key: '_renderChunk',
        value: function _renderChunk(node, from) {
            var finalItem = from + this.cachedItemsLen;
            if (finalItem > this.totalRows) finalItem = this.totalRows;

            // Append all the new rows in a document fragment that we will later append to
            // the parent node
            var fragment = document.createDocumentFragment();
            for (var i = from; i < finalItem; i++) {
                fragment.appendChild(this.createRow(i));
            }

            // Hide and mark obsolete nodes for deletion.
            for (var j = 1, l = node.childNodes.length; j < l; j++) {
                node.childNodes[j].style.display = 'none';
                node.childNodes[j].setAttribute('data-rm', '1');
            }
            node.appendChild(fragment);
        }
    }, {
        key: 'createContainer',
        value: function createContainer(w, h) {
            var c = document.createElement('div');
            return c;
        }
    }, {
        key: 'createScroller',
        value: function createScroller(h) {
            var scroller = document.createElement('div');
            return scroller;
        }
    }, {
        key: 'innerArrayInHTML',
        value: function innerArrayInHTML(obj, data, templateList) {

            //TODO: вынести логику сортировки
            //TODO: переделать логику сортировку по ключу, вместо surname
            //TODO: сделать заголовки списка в зависимости от regex,
            //TODO: сделать возможность не обязательных заголовков в листе
            //TODO:

            data.sort(function (a, b) {
                console.log();
                var surname = [a.name.split(' ')[1], b.name.split(' ')[1]];
                if (surname[0] > surname[1]) {
                    return 1;
                }
                if (surname[0] < surname[1]) {
                    return -1;
                }
                // a должно быть равным b
                return 0;
            });

            var fs = data[0].name.split(" ")[1].charAt(0);
            data.splice(0, 0, { name: fs });

            for (var i = 0; i < data.length; i++) {
                if (i < data.length - 1 && fs != data[i + 1].name.split(" ")[1].charAt(0)) {
                    fs = data[i + 1].name.split(" ")[1].charAt(0);
                    data.splice(i, 0, { name: fs });
                    i++;
                }
            }

            for (var _i = 0; _i < document.querySelectorAll(obj.domElement).length; _i++) {
                var el = document.querySelectorAll(obj.domElement)[_i];
                el.innerHTML = templateList.constructor(obj.template, data);
                this.VirtualListConfig({
                    w: 300,
                    h: 300,
                    itemHeight: 31,
                    totalRows: 10000
                });
            }
        }
    }]);

    return VirtualList;
}();

;

//# sourceMappingURL=pure-virtual-list.js.map