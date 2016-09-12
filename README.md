# tenzorTZ
virtual-scroll-list on ES6

#TODO:

- сделать заголовки списка в зависимости от regex
- сделать возможность не обязательных заголовков в листе
- сделать горизонтальный виртуал скрол
- сделать ивенты для тачей, ресайза, сркола с помощью клавиатуры, возможно другие.
- добавить функцию генерации тимплейта

#How to start

    npm install
    npm run babel

#How to use

    //Config example
    var configVirtualList = {
        domElement: 'div#leftTopList',
        domContainer: {
            class: 'container-list list-group'
        },
        sortKey: 'first',
        itemHeight: 50,
        itemBuffer: 10,
        template: 'list'
    };

    //Get data from server if you need
    var dataRequest = {
        url: 'example/data-names.json',
        method: 'GET',
        statusAcceptence: [200, 201, 204],
        headers: [
            {
                name: 'Content-Type',
                value: 'application/json'
            }
        ]
    };

    //Create template exemplar
    var ls = new ListTemplate;


    //Async request to server, on callback make virtual list with config
    new Api(dataRequest).then(
        function(res){
            new VirtualList(configVirtualList, JSON.parse(res.response), ls);
        },
        function(err){
            console.log(err);
        }
    );

