var orderShipments = function(key){
  var shipment = SkyShop.order.shipments[key];
  var trans = {
    city: L['USER_CITY'],
    street: L['USER_STREET2']
  };
  var type = 'default',
      additionalOrderOption = null,
      paczkomatyGmap = typeof $('.order').data('inpost-gmaps') !== 'undefined' ? $('.order').data('inpost-gmaps') : null;

  var data = {
    cities: {},
    streets: {}
  };

  var template = {
    render: [
      '<span class="order-title-section">{{:city:}}</span>',
      '<div data-valid-box>',
        '<select class="order-country core_orderShipmentSelect" data-key="{{:key:}}" data-type="{{:type:}}" data-valid="orderShipmentSelect">',
          '{{:options_city:}}',
        '</select>',
      '</div>',
      '<span class="order-title-section">{{:street:}}</span>',
      '<div data-valid-box>',
        '<select class="order-country core_orderShipmentSelectStreet" data-streets="{{:key:}}" data-valid="orderShipmentSelect">',
          '{{:options_streets:}}',
        '</select>',
      '</div>',
      '<div class="hidden">',
        '<input type="hidden" name="shipment_method[{{:key:}}]" />',
      '</div>',
      '{{:additional_order_option:}}'
    ].join(''),
    option: [
      '<option value="{{:value:}}">{{:name:}}</option>'
    ].join('')
  };

  var storeCities = function(store,keyCity,keyStreets){
    store.forEach(function(item){
      var city = $.base64Encode(item[keyCity]),
          cityName = item[keyCity],
          streetData = {};

      if(typeof data.cities[city] === 'undefined'){
        data.cities[city] = cityName;
      }

      if(typeof data.streets[city] === 'undefined'){
        data.streets[city] = [];
      }

      keyStreets.forEach(function(option){
        var optionKey = option.split('|');

        streetData[optionKey[0]] = item[optionKey[1]];
      });

      data.streets[city].push(streetData)
    });

    SkyShop.order.shipmentsParsed[key] = {
      cities: data.cities,
      streets: data.streets
    };
  };

  var setTrans = function(set){
    set.forEach(function(option){
      var optionKey = option.split('|');

      trans[optionKey[0]] = optionKey[1];
    });
  };

  /* ================================================================================================================
   * CUSTOM OPTIONS FOR SPECIFIC SHIPMENTS METHODS
   */

  if(typeof SkyShop.order.shipmentsParsed[key] === 'undefined'){
    switch(shipment['function']){
      case 'paczkomaty':
        setTrans([
          'street|Paczkomat'
        ]);

        storeCities(shipment['methods'],'cit',[
          'id|id',
          'street|str',
          'number|no',
          'description|desc',
          'cashOnDelivery|pbd'
        ]);
      break;
      case 'paczka_w_ruchu':
        setTrans([
          'street|Kiosk'
        ]);

        storeCities(Object.keys(shipment['methods']).map(function(key){ return shipment['methods'][key]; }),'City',[
          'id|PSD',
          'street|StreetName',
          'number|DestinationCode',
          'description|Location',
          'cashOnDelivery|CashOnDelivery'
        ]);
      break;
      case 'odbior_w_punkcie':
        setTrans([
          'street|Punkt odbioru'
        ]);

        storeCities(Object.keys(shipment['methods']).map(function(key){ return shipment['methods'][key]; }),'miejscowosc',[
          'id|pni',
          'street|ulica',
          'number|kod',
          'description|nazwa'
        ]);
      break;
    };
  }

  switch(shipment['function']){
    case 'paczkomaty':
      if(paczkomatyGmap != null){
        additionalOrderOption = [
          '<span class="order-title-section hidden-on-mobile">',
            '<a href="#" class="core_orderOpenMapPaczkomaty">',
              'Wybierz paczkomat z mapy',
            '</a>',
          '</span>'
        ];
      }
    break;
  }

  type = shipment['function'];

  /* ================================================================================================================
   * CREATE HTML
   */

  template.render = template.render.replace(/{{:key:}}/g,key);
  template.render = template.render.replace(/{{:type:}}/g,type);
  template.render = template.render.replace(/{{:city:}}/g,trans.city);
  template.render = template.render.replace(/{{:street:}}/g,trans.street);
  if(additionalOrderOption == null){
    template.render = template.render.replace(/{{:additional_order_option:}}/g,'');
  }else{
    template.render = template.render.replace(/{{:additional_order_option:}}/g,additionalOrderOption.join(''));
  }

  var cities = SkyShop.order.shipmentsParsed[key].cities;

  var renderOptions = {
    cities: template.option
  };

  renderOptions.cities = renderOptions.cities.replace(/{{:value:}}/g,'');
  renderOptions.cities = renderOptions.cities.replace(/{{:name:}}/g,'-- ' + L['SELECT'] + ' --');

  for(var itemCity in cities){
    var item = {
      value: itemCity,
      name: cities[itemCity]
    }

    var option = template.option;
        option = option.replace(/{{:value:}}/g,item.name);
        option = option.replace(/{{:name:}}/g,item.name);

    renderOptions['cities'] += option;
  }

  template.render = template.render.replace(/{{:options_city:}}/g,renderOptions['cities']);

  return $(template.render);
};

var orderShipmentsStreets = function(key,type,city,callback){
  var city = $.base64Encode(city),
      streets = SkyShop.order.shipmentsParsed[key].streets[city],
      payDelivery = SkyShop.order.shipments[SkyShop.order.shipmentSelected].pay_delivery !== 'no';

  if(payDelivery && ['odbior_w_punkcie'].indexOf(type) == -1){
    var allowedStreets = [];

    streets.forEach(function(street){
      if(typeof street.cashOnDelivery !== 'undefined' && (street.cashOnDelivery == 1 || street.cashOnDelivery == 'true')){
        allowedStreets.push(street);
      }
    });

    streets = allowedStreets;
  }

  var template = {
    render: '',
    option: [
      '<option value="{{:value:}}" data-options="{{:options:}}" {{:selected:}}>{{:name:}}</option>'
    ].join('')
  };

  var renderOptions = {
    streets: template.option
  };

  renderOptions.streets = renderOptions.streets.replace(/{{:value:}}/g,'');
  renderOptions.streets = renderOptions.streets.replace(/{{:options:}}/g,'');
  renderOptions.streets = renderOptions.streets.replace(/{{:name:}}/g,'-- ' + L['SELECT'] + ' --');

  streets.sort(function(a,b){
    return a.street.toLowerCase().localeCompare(b.street.toLowerCase());
  });

  for(var itemStreet in streets){
    var item = SkyShop.order.shipmentsParsed[key].streets[city][itemStreet];

    var options = [];

    Object.keys(item).forEach(function(i){
      if(i != 'id' || i != 'number'){
        options.push(i);
        options.push(':');
        options.push(item[i]);
        options.push('|');
      }
    });

    options = options.join('');
    options = options.substring(0,options.length - 1);

    var option = template.option;
        option = option.replace(/{{:value:}}/g,item.id);
        option = option.replace(/{{:options:}}/g,options);
        option = option.replace(/{{:name:}}/g,item.street + ' ' + item.number);

    if(cookies.read('ac_ship' + key + '_method') != null && cookies.read('ac_ship' + key + '_method') == item.id){
        option = option.replace(/{{:selected:}}/g,'selected');
    }else{
        option = option.replace(/{{:selected:}}/g,'');
    }

    renderOptions['streets'] += option;
  }

  template.render = renderOptions['streets'];

  $('[data-streets="' + key + '"]').html(template.render);
  $('[data-streets="' + key + '"]').select2({
    theme: 'bootstrap',
    width: '100%',
    language: {
      noResults: function(){
        return L['FIRST_SELECT_CITY'];
      }
    },
    escapeMarkup: function(markup){
      return markup;
    },
    templateResult: function(result){
      if(result.id == ''){
        return result.text;
      }

      var options = {},
          option;

      if(typeof result.element !== 'undefined'){
        option = result.element.getAttribute('data-options').split('|');
        option.forEach(function(i){
          i = i.split(':');

          options[i[0]] = i[1];
        });
      }

      switch(type){
        case 'paczkomaty':
          return [
            '<div class="order-shipment-item">',
              '<div class="order-shipment-item-logo">',
                '<img src="/inc/shipments/paczkomaty/247.png" />',
              '</div>',
              '<div class="order-shipment-item-name">',
                '<div class="order-shipment-item-name-wrapper">',
                  '<span>' + result.text + '</span>',
                  typeof options.description != 'undefined' && options.description != '' ? '<br /><small>' + options.description + '</small>' : '',
                '</div>',
              '</div>',
            '</div>'
          ].join('');
        break;
        case 'paczka_w_ruchu':
          return [
            '<div class="order-shipment-item">',
              '<div class="order-shipment-item-logo">',
                '<img src="/inc/shipments/paczka_w_ruchu/kiosk.png" />',
              '</div>',
              '<div class="order-shipment-item-name">',
                '<div class="order-shipment-item-name-wrapper">',
                  '<span>' + result.text + '</span>',
                  typeof options.description != 'undefined' && options.description != '' ? '<br /><small>' + options.description + '</small>' : '',
                '</div>',
              '</div>',
            '</div>'
          ].join('');
        break;
        case 'odbior_w_punkcie':
          return [
            '<div class="order-shipment-item">',
              '<div class="order-shipment-item-logo">',
                '<img src="/inc/shipments/odbior_w_punkcie/punkt_pp.png" />',
              '</div>',
              '<div class="order-shipment-item-name">',
                '<div class="order-shipment-item-name-wrapper">',
                  '<span>' + result.text + '</span>',
                  typeof options.description != 'undefined' && options.description != '' ? '<br /><small>' + options.description + '</small>' : '',
                '</div>',
              '</div>',
            '</div>'
          ].join('');
        break;
        default:
          return result.text;
        break;
      };
    }
  }).on('select2:open',function(){
    $('.select2-results > ul').scrollbar();
  }).on('select2:closing',function(){
    $('.select2-results > ul').scrollbar('destroy');
  });

  if(typeof callback !== 'undefined'){
    callback();
  }
};

/* ================================================================================================================
 * NEEDED VARS
 */

var mapObj;
var SUBMIT_TEXT;
