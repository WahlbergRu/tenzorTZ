/**
 * Created by allin_000 on 04.09.2016.
 */

//Если есть необходимость
class Api {
    constructor(obj){
        return new Promise(
            function (resolve, reject) {

                if (!obj) reject(new Error('Haven\'t setting'));

                const request = new XMLHttpRequest();

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
                    reject(new Error('XMLHttpRequest Error: '+this.statusText));
                };

                request.ontimeout = function(){
                    reject(new Error('XMLHttpRequest Error: timeout'));
                };

                request.onloadstart = function(){
                    if (obj.onloadstart) obj.onloadstart();
                };

                request.onloadend = function(){
                    if (obj.onloadend) obj.onloadend();
                };

                request.onprogress = function(){
                    if (obj.onprogress) obj.onprogress();
                };

                //XHR settings
                if (obj.timeout){request.timeout = obj.timeout;}
                if (!obj.method){obj.method = 'GET'}
                request.open(obj.method, obj.url, true);

                if (obj.headers && obj.headers.length){
                    for (var i = 0; i < obj.headers.length; i++) {
                        request.setRequestHeader(obj.headers[i].name, obj.headers[i].value);
                    }
                }

                obj.body?request.send(obj.body):request.send();

            });
    };
};


//Если нужно написать тимплейт со своей сериализацией
class ListTemplate{

    constructor(template, items, key){

        if (!template) return false;
        var html;


        switch (template) {
            case 'list':
                var item = items;
                if (key){
                    html =
                        (item[key].length > 1)
                            ? `<a href="#action-${item[key]}" class="list-group-item list-group-item-action">${item[key]}</a>`
                            : `<div class="list-group-item ">${item[key]}</div>`
                    ;
                }
                break;

            default:
                console.log('шаблона нету');
                return false;
        }


        return html;
    }
};

class VirtualList {

    constructor(obj, data, templateList){

        //TODO: сделать заголовки списка в зависимости от regex,
        //TODO: сделать возможность не обязательных заголовков в листе
        this.templateList = templateList;
        this.config = obj;
        this.data = this.sortedByKey(data, this.config.sortKey);

        for (let i = 0; i < document.querySelectorAll(obj.domElement).length; i++) {
            let el = document.querySelectorAll(obj.domElement)[i];
            this.VirtualListConfig(el);
        }
    }

    VirtualListConfig(el) {
        if (!el || !this.data.length) return false;
        //TODO: было бы не плохо сделать лист горизонтальным
        const width = el.offsetWidth+'px';
        const height = el.offsetHeight;
        const itemHeight = this.itemHeight = this.config.itemHeight;
        const fullHeight = itemHeight * this.data.length;

        this.items = this.data;
        this.totalRows = this.config.totalRows || (this.data.length);

        const scrollerStart = this.createScroller(0);
        const scrollerEnd   = this.createScroller(itemHeight * this.data.length);

        let cont = el.appendChild(this.createContainer(this.config.domContainer.class));
        cont.appendChild(scrollerStart);
        cont.appendChild(scrollerEnd);

        const screenItemsLen = Math.ceil(height / itemHeight);

        this.cachedItemsLen = screenItemsLen + this.config.itemBuffer;
        this._renderChunk(cont, 0);

        const self = this;
        let lastRepaintY;
        const maxBuffer = itemHeight;
        let lastScrolled = 0;

        //TODO: #chank 2
        this.rmNodeInterval = setInterval(() => {
            if (Date.now() - lastScrolled > 100) {
                const badNodes = document.querySelectorAll('[data-rm="delete"]');
                for (let i = 0, l = badNodes.length; i < l; i++) {
                    cont.removeChild(badNodes[i]);
                }
            }
        }, 300);

        function onScroll(e) {
            let scrollTop = e.target.scrollTop; // Triggers reflow
            let topHeight = fullHeight-scrollTop - screenItemsLen * itemHeight;

            cont.firstChild.style.minHeight = scrollTop+'px';
            cont.lastChild.style.minHeight = topHeight+'px';

            if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > maxBuffer) {
                var first = parseInt(scrollTop / itemHeight);
                self._renderChunk(cont, first < 0 ? 0 : first);
                lastRepaintY = scrollTop;
            }

            lastScrolled = Date.now();
            e.preventDefault && e.preventDefault();
        }

        //TODO: провесить ивенты для тачей, ресайза, сркола с помощью клавиатуры, возможно другие.
        cont.addEventListener('scroll', onScroll);
    }

    createRow(i) {
        return this.templateList.constructor(this.config.template, this.items[i], this.config.sortKey);
        //TODO: добавить функцию генерации
    }

    _renderChunk(node, from) {
        let finalItem = from + this.cachedItemsLen;
        if (finalItem > this.totalRows) finalItem = this.totalRows;

        function htmlToElements(html) {
            var template = document.createElement('template');
            template.innerHTML = html;
            return template.content;
        }

        let htmlArr = [];
        for (let i = from; i < finalItem; i++) {
            htmlArr += this.createRow(i);
        }

        let domInsert = htmlToElements(htmlArr);

        //TODO: переписать это уёбищество с заменой дом дерева на удаление и добавление по кол-ву необходимых чанков
        //TODO: #chank 1
        for (let j = 1, l = node.childNodes.length; j < l-1; j++) {
            node.childNodes[j].style.display = 'none';
            node.childNodes[j].setAttribute('data-rm', 'delete');
        }

        node.insertBefore(domInsert, node.lastChild);
    }

    createContainer(classListString) {
        var c = document.createElement('div');
        c.classList.value = classListString;
        return c;
    }

    createScroller(height) {
        var scroller = document.createElement('div');
        scroller.style.opacity = 0;
        scroller.style.top = 0;
        scroller.style.left = 0;
        scroller.style.width = '100%';
        scroller.style.minHeight = height + 'px';
        return scroller;
    }

    sortedByKey(data, key){

        data.sort(function(a,b){
            if (a[key] > b[key]) {
                return 1;
            }
            if (a[key] < b[key]) {
                return -1;
            }
            // a должно быть равным b
            return 0;
        });

        let fs = data[0][key].charAt(0);
        let sortObj = {};
        sortObj[key] = fs;
        data.splice(0, 0, sortObj);

        for (let i = 0; i < data.length; i++) {
            if (i<data.length-1 && fs != data[i+1][key].charAt(0)){
                fs = data[i+1][key].charAt(0);
                let sortObj = {};
                sortObj[key] = fs;
                data.splice(i+1, 0, sortObj);
                i++;
            }
        }

        return data;

    }

};

