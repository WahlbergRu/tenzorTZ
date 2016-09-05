/**
 * Created by allin_000 on 04.09.2016.
 */

var pureVirtualList = (function () {

    var version = '1.0.0';

    const tmpl = addrs => `
        <div class="list-group">
            ${addrs.map(addr =>
                (addr.name.length>1)
                ?`<a href="#action-${addr.guid}-${addr.email}-${addr.company}" class="list-group-item list-group-item-action">${addr.name}</a>`
                :`<div class="list-group-item ">${addr.name}</div>`
            ).join('')}
        </div>
    `;


    //TODO: вынести виртуал лист в отдельный класс, за джойнить в виде модуля к текущему.

    function VirtualList(config) {
        const width = (config && `${config.w}px`) || '100%';
        const height = (config && `${config.h}px`) || '100%';
        const itemHeight = this.itemHeight = config.itemHeight;

        this.items = config.items;
        this.generatorFn = config.generatorFn;
        this.totalRows = config.totalRows || (config.items && config.items.length);

        const scroller = VirtualList.createScroller(itemHeight * this.totalRows);
        this.container = VirtualList.createContainer(width, height);
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

    function createRow(i) {
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

    function _renderChunk(node, from) {
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

    function createContainer(w, h) {
        var c = document.createElement('div');
        return c;
    }

    function createScroller(h) {
        var scroller = document.createElement('div');
        return scroller;
    }


    //TODO вынести xhr запрос в отдельный класс
    function requestOnServer(obj){
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

    function innerArrayInHTML(elem, data){

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

        for (let i = 0; i < document.querySelectorAll(elem).length; i++) {
            let el = document.querySelectorAll(elem)[i];
            el.innerHTML = tmpl(data);
        }
    };

    function init(obj) {

        if (obj.data){
            innerArrayInHTML(obj.domElement, obj.data);
        } else if (obj.dataRequest){
            requestOnServer(obj.dataRequest).then(
                function(res){
                    innerArrayInHTML(obj.domElement, JSON.parse(res.response));
                },
                function(err){console.log(err)}
            );
        }
    };

    return {
        init: function (obj) {
            init(obj);
        },
        version: function(){
            return version;
        }
    };

}());

