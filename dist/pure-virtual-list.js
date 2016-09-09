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

    constructor(template, items){

        if (!template) return false;
        var html;
        switch (template) {
            case 'list':
                html = items => `
                    <div class="list-group">
                        ${items.map(item =>
                        (item.name.length > 1)
                            ? `<a href="#action-${item.guid}-${item.email}-${item.company}" class="list-group-item list-group-item-action">${item.name}</a>`
                            : `<div class="list-group-item ">${item.name}</div>`
                        ).join('')}
                    </div>
                `;
                break;

            default:
                console.log('шаблона нету');
                return false;
        }

        return html(items);
    }
};

//Виртуал лист.
class VirtualList {

    VirtualListConfig(config) {
        const width = (config && `${config.w}px`) || '100%';
        const height = (config && `${config.h}px`) || '100%';
        const itemHeight = this.itemHeight = config.itemHeight;

        this.items = config.items;
        this.generatorFn = config.generatorFn;
        this.totalRows = config.totalRows || (config.items && config.items.length);

        const scroller = this.createScroller(itemHeight * this.totalRows);
        this.container = this.createContainer(width, height);
        this.container.appendChild(scroller);

        const screenItemsLen = Math.ceil(config.h / itemHeight);
        // Cache 4 times the number of items that fit in the container viewport
        this.cachedItemsLen = screenItemsLen * 3;
        this._renderChunk(this.container, 0);

        const self = this;
        let lastRepaintY;
        const maxBuffer = screenItemsLen * itemHeight;
        let lastScrolled = 0;

        this.rmNodeInterval = setInterval(() => {
            if (Date.now() - lastScrolled > 100) {
                const badNodes = document.querySelectorAll('[data-rm="1"]');
                for (let i = 0, l = badNodes.length; i < l; i++) {
                    self.container.removeChild(badNodes[i]);
                }
            }
        }, 300);

        function onScroll(e) {
            const scrollTop = e.target.scrollTop; // Triggers reflow
            if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > maxBuffer) {
                const first = parseInt(scrollTop / itemHeight) - screenItemsLen;
                self._renderChunk(self.container, first < 0 ? 0 : first);
                lastRepaintY = scrollTop;
            }

            lastScrolled = Date.now();
            e.preventDefault && e.preventDefault();
        }

        this.container.addEventListener('scroll', onScroll);
    }

    createRow(i) {
        let item;
        if (this.generatorFn)
            item = this.generatorFn(i);
        else if (this.items) {
            if (typeof this.items[i] === 'string') {
                const itemText = document.createTextNode(this.items[i]);
                item = document.createElement('div');
                item.style.height = `${this.itemHeight}px`;
                item.appendChild(itemText);
            } else {
                item = this.items[i];
            }
        }

        item.classList.add('vrow');
        item.style.position = 'absolute';
        item.style.top = `${i * this.itemHeight}px`;
        return item;
    }

    _renderChunk(node, from) {
        let finalItem = from + this.cachedItemsLen;
        if (finalItem > this.totalRows) finalItem = this.totalRows;

        // Append all the new rows in a document fragment that we will later append to
        // the parent node
        const fragment = document.createDocumentFragment();
        for (let i = from; i < finalItem; i++) {
            fragment.appendChild(this.createRow(i));
        }

        // Hide and mark obsolete nodes for deletion.
        for (let j = 1, l = node.childNodes.length; j < l; j++) {
            node.childNodes[j].style.display = 'none';
            node.childNodes[j].setAttribute('data-rm', '1');
        }
        node.appendChild(fragment);
    }

    createContainer(w, h) {
        var c = document.createElement('div');
        return c;
    }

    createScroller(h) {
        var scroller = document.createElement('div');
        return scroller;
    }

    innerArrayInHTML(obj, data, templateList){

        //TODO: вынести логику сортировки
        //TODO: переделать логику сортировку по ключу, вместо surname
        //TODO: сделать заголовки списка в зависимости от regex,
        //TODO: сделать возможность не обязательных заголовков в листе
        //TODO:

        data.sort(function(a,b){
            console.log();
            let surname = [a.name.split(' ')[1], b.name.split(' ')[1]];
            if (surname[0] > surname[1]) {
                return 1;
            }
            if (surname[0] < surname[1]) {
                return -1;
            }
            // a должно быть равным b
            return 0;
        });

        let fs = data[0].name.split(" ")[1].charAt(0);
        data.splice(0, 0, {name: fs});

        for (let i = 0; i < data.length; i++) {
            if (i<data.length-1 && fs != data[i+1].name.split(" ")[1].charAt(0)){
                fs = data[i+1].name.split(" ")[1].charAt(0);
                data.splice(i, 0, {name: fs});
                i++;
            }
        }

        for (let i = 0; i < document.querySelectorAll(obj.domElement).length; i++) {
            let el = document.querySelectorAll(obj.domElement)[i];
            el.innerHTML = templateList.constructor(obj.template, data);
            this.VirtualListConfig({
                w: 300,
                h: 300,
                itemHeight: 31,
                totalRows: 10000
            });
        }
    };

};

