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


    var pvl = {
        domElement: 'div#leftTopList',
        domContainer: {
            class: 'container-list list-group'
        },
        sortKey: 'first',
        itemHeight: 50,
        itemBuffer: 10,
        template: 'list'
    };

    //TODO: сделать конфиг для api, а по урлам получать информацию. Да бы не плодить статус и хидеры, они всё равно летают в промайзе.
    //TODO: вынести в отдельный модуль api
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

    var ls = new ListTemplate;

    new Api(dataRequest).then(
        function(res){
            new VirtualList(pvl, JSON.parse(res.response), ls);
        },
        function(err){
            console.log(err);
        }
    );

