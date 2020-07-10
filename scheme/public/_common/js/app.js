document.documentElement.className += (('ontouchstart' in document.documentElement) ? 'touch' : 'no-touch');

var addEvent = function(object,type,callback){
  if(object == null || typeof(object) == 'undefined') return;
  if(object.addEventListener){
    object.addEventListener(type,callback,false);
  }else if(object.attachEvent){
    object.attachEvent('on' + type,callback);
  }else{
    object['on' + type] = callback;
  }
};

var headerMenuFormatter = function(minWidth,ignoredClass){
  var header = document.getElementById('header'),
      menu = header != null ? header.querySelector('.menu[data-action="inline"]') : null;

  if(header == null || menu == null || window.innerWidth < minWidth){
    return false;
  }

  if(menu.classList.contains('menu-calculate')){
    menu.classList.remove('menu-calculate');
  }

  var data = {
    elements: {
      menu: menu,
      hamburger: header.querySelector('.menu[data-action="inline"] li.hamburger'),
      // All links elements
      links: header.querySelectorAll('.menu[data-action="inline"] > ul > li' + ['hamburger'].concat(typeof ignoredClass !== 'undefined' ? ignoredClass : undefined).filter(function(className){
        return className;
      }).map(function(className){
        return ':not(.' + className + ')';
      }).join('')),
      // Elements that must be show eq. search icon, expect hamburger element
      ignored: typeof ignoredClass !== 'undefined' ? header.querySelectorAll(ignoredClass.map(function(className){
        return '.menu[data-action="inline"] > ul > li.' + className;
      }).join(',')) : []
    },
    calculated: {
      menuWidth: 0,
      linksWidth: 0,
      linksWidthCount: 0,
      ignoredWidth: 0,
      hamburgerWidth: 0
    }
  },
  calculateWidth = function(key,element){
    var width = element.getBoundingClientRect().width;

    if(typeof element.dataset.saveWidth === 'undefined'){
      element.dataset.saveWidth = width;
    }

    data.calculated[key] = Big(data.calculated[key]).plus(element.dataset.saveWidth);
  };

  [].forEach.call(data.elements.links,calculateWidth.bind(this,'linksWidth'));
  [].forEach.call(data.elements.ignored,calculateWidth.bind(this,'ignoredWidth'));

  data.calculated.menuWidth = data.elements.menu.getBoundingClientRect().width;
  data.calculated.hamburgerWidth = data.elements.hamburger.getBoundingClientRect().width;

  data.elements.hamburger.querySelector('.hambureger-elements').innerHTML = '';

  if(Big(data.calculated.linksWidth).plus(data.calculated.ignoredWidth) > data.calculated.menuWidth){
    // Show hamburger, hide redundant links
    if(data.elements.hamburger.classList.contains('hidden')){
      data.elements.hamburger.classList.remove('hidden');
    }

    data.calculated.linksWidthCount = Big(data.calculated.ignoredWidth).plus(data.calculated.hamburgerWidth);

    [].forEach.call(data.elements.links,function(element,index){
      data.calculated.linksWidthCount = Big(data.calculated.linksWidthCount).plus(element.dataset.saveWidth);

      if(data.calculated.linksWidthCount > data.calculated.menuWidth){
        element.style.display = 'none';

        var cloneElement = data.elements.hamburger.querySelector('.hambureger-elements').appendChild(element.cloneNode(true));
            cloneElement.style.display = '';

        delete cloneElement.dataset.saveWidth;
      }else{
        element.style.display = '';
      }
    });
  }else{
    // Hide hamburger, show all links
    [].forEach.call(data.elements.links,function(element,index){
      element.style.display = '';
    });

    if(!data.elements.hamburger.classList.contains('hidden')){
      data.elements.hamburger.classList.add('hidden');
    }
  }
};

$.fn.transition = function(type,duration,complete){
  var self = $(this),
      velocity = $(document).velocity,
      callback = false;

  if(typeof duration === 'undefined'){
    duration = 100;
  }

  if(typeof complete !== 'undefined'){
    callback = true;
  }

  if(typeof velocity !== 'undefined'){
    if(callback){
      self.velocity(type,{
        duration: duration,
        complete: complete.bind(self)
      });
    }else{
      self.velocity(type,{
        duration: duration
      });
    }
  }else{
    if(callback){
      self[type](duration,complete.bind(self));
    }else{
      self[type](duration);
    }
  }
};

var initializeSelect2 = function(element,params){
  if(typeof element === 'undefined'){
    element = $('.select-field-select2:not([data-initialize="false"])');
  }

  var defaultParams = {
    closeOnSelect: true,
    dropdownParent: null,
    selectLang: L['SELECT'],
    selectCallback: void 0
  };

  if(typeof params !== 'undefined'){
    Object.keys(params).forEach(function(key){
      defaultParams[key] = params[key];
    });

    params = defaultParams;
  }else{
    params = defaultParams;
  }

  element.select2({
    placeholder: true,
    width: '100%',
    theme: 'bootstrap',
    closeOnSelect: params.closeOnSelect,
    dropdownCssClass: 'select-field-select2-dropdown',
    minimumResultsForSearch: Infinity,
    dropdownParent: params.dropdownParent,
    language: {
      noResults: function(){
        return '<div class="select-field-select2-no-results"></div>';
      }
    },
    escapeMarkup: function(markup){
      return markup;
    }
  }).on('select2:open',function(){
    var self = $(this);

    $('.select2-search').find('input[type="search"]').prop('focus',false);
    $('.select2-results > ul').scrollbar();

    $('.select2-results').after($([
      '<div class="select2-set-params">',
        '<span>' + params.selectLang + '</span>',
      '</div>'
    ].join('')).on('click',function(){
      if(typeof params.selectCallback === 'undefined'){
        element.select2('close');
      }else{
        params.selectCallback({
          select: element,
          select2: self
        });
      }
    }));
  }).on('select2:closing',function(){
    $('.select2-results > ul').scrollbar('destroy');
  }).on('select2:select',function(e){
    $(this).children('option[value="' + $(this).val() + '"]').trigger('click');
  }).next().addClass('select-field-select2-container');
};

var nettoToBrutto = function(value,tax){
  tax = isNaN(parseFloat(tax)) ? 0 : tax;

  return (Big(value).times(
    Big(
      Big(100).plus(tax)
    ).div(100)
  )).toFixed(2);
}

var bruttoToNetto = function(value,tax){
  tax = isNaN(parseFloat(tax)) ? 0 : tax;

  return (Big(value).minus(
    Big(
      Big(value).times(Big(tax).div(100))
    ).div(
      Big(Big(100).plus(tax)).div(100)
    )
  )).toFixed(2);
}

var stringPricesFormatter = function(value){
  var body = $('body'),
      symbol = body.attr('data-used').split('|')[1];

  if(symbol == '£' || symbol == '$'){
    symbol = symbol + value;
  }else{
    symbol = value + String.fromCharCode(160) + symbol;
  }

  return symbol;
};

var pricesFormatterData = {};

var pricesFormatter = function(selectors,update){
  var selector,
      data = $('body'),
      priceType = data.attr('data-hurt-price-type');

  if(priceType == 'netto' || priceType == 'netto_brutto'){
    priceType = L['NET'];
  }else if(priceType == 'brutto'){
    priceType = L['GROSS'];
  }

  if(typeof selectors === 'undefined' || selectors == '*'){
    selector = $('.core_priceFormat');
  }else if(typeof selectors === 'object'){
    selector = selectors.find('.core_priceFormat');
  }

  if(typeof update !== 'undefined' && update === true || Object.keys(pricesFormatterData).length == 0){
    var dataRates = {};

        data.attr('data-rates').split(',').forEach(function(c){
          var name = c.split(':')[0].replace(/'/g,''),
              rate = parseFloat(c.split(':')[1]) !== 1 ? Big(1).div(parseFloat(c.split(':')[1])).toFixed(4) : 1;

          dataRates[name] = rate;
        });

    pricesFormatterData = {
      money: {
        base: data.attr('data-base'),
        used: data.attr('data-used').split('|')[0],
        rates: dataRates
      },
      accounting: {
        symbol: data.attr('data-used').split('|')[1],
        format: data.attr('data-used').split('|')[1] == '£' || data.attr('data-used').split('|')[1] == '$' ? '%s%v' : '%v' + String.fromCharCode(160) + '%s',
        decimal: data.attr('data-decimal'),
    		thousand: data.attr('data-thousand') == ' ' ? String.fromCharCode(160) : data.attr('data-thousand'),
        precision: 2
      }
    };

    fx.base = pricesFormatterData.money.base;
    fx.rates = pricesFormatterData.money.rates;
    accounting.settings.currency = pricesFormatterData.accounting;
  }

  var priceTypeFormatter = function(price,element){
    var attr = element.attr('data-price-type');

    if(typeof attr !== 'undefined' && typeof attr.split('|')[1] !== 'undefined' && attr.split('|')[1] == 'show_type'){
      if(priceType.toLowerCase() == L['NET'].toLowerCase() && attr.split('|')[0] == 'brutto'){
        return price + String.fromCharCode(160) + L['GROSS'];
      }else{
        return price + String.fromCharCode(160) + priceType;
      }
    }else{
      return price;
    }
  }

  selector.each(function(){
    var self = $(this),
        priceValue,
        price;

    if(self.data('price') == data.attr('data-hurt-price-text')){
      priceValue = parseFloat(self.data('price'));
    }else{
      if(typeof self.attr('data-price-type') !== 'undefined' && (self.attr('data-price-type').split('|')[0] == 'netto' || self.attr('data-price-type').split('|')[0] == 'netto_brutto')){
        priceValue = bruttoToNetto(parseFloat(self.data('price')),self.data('tax'));
      }else{
        priceValue = parseFloat(self.data('price'));
      }

      price = accounting.formatMoney(fx.convert(priceValue,{
        from: pricesFormatterData.money.base,
        to: pricesFormatterData.money.used
      }));
    }

    if(isNaN(priceValue)){
      var config = accounting.settings.currency;

      if(typeof self.attr('data-tax') !== 'undefined' && data.attr('data-hurt-price-text') != ''){
        price = data.attr('data-hurt-price-text');
      }else{
        if(data.attr('data-used').split('|')[1] == '£' || data.attr('data-used').split('|')[1] == '$'){
          price = config.symbol + '-,--';
        }else{
          price = '-,--' + String.fromCharCode(160) + config.symbol;
        }
      }
    }

    if(price && !isNaN(price) && data.attr('data-decimal-hide') == 1){
      var config = accounting.settings.currency,
          symbol = data.attr('data-used').split('|')[1],
          based = price.split(config.decimal)[0],
          decimals = price.split(/,|\./).pop().split(String.fromCharCode(160))[0];

      if(decimals == '00'){
        if(data.attr('data-used').split('|')[1] == '£' || data.attr('data-used').split('|')[1] == '$'){
          based = price.split(/,|\./);
          based.pop();
          based = based.join(config.thousand);
          self.text(priceTypeFormatter(based,self));
        }else{
          based = price.split(/,|\./);
          based.pop();
          based = based.join(config.thousand);
          self.text(priceTypeFormatter(based + String.fromCharCode(160) + config.symbol,self));
        }
      }else{
        self.text(priceTypeFormatter(price,self));
      }
    }else{
      if (price) {
        self.text(priceTypeFormatter(price,self));
      } else if (data.attr('data-hurt-price-text')) {
        self.text(priceTypeFormatter(data.attr('data-hurt-price-text'),self));
      }
    }
  });
}

// var Prices = (function(){
//   this._priceType = S['CURRENCY'].hurt_price.type == 'netto' || S['CURRENCY'].hurt_price.type == 'netto_brutto' ? L['NET'] : L['GROSS'];
//   this._formatSettings = {};
//   this._formatType = function(value,element){
//     var attr = $(this).data('price-type'),
//         type = attr.split('|')[0],
//         show = attr.split('|')[1];
//
//     if(typeof attr !== 'undefined' && typeof show !== 'undefined' && show == 'show_type'){
//       if(this._priceType.toLowerCase() == L['NET'].toLowerCase() && type == 'brutto'){
//         return value + String.fromCharCode(160) + L['GROSS'];
//       }else{
//         return value + String.fromCharCode(160) + this._priceType;
//       }
//     }else{
//       return value;
//     }
//   }.bind(this);
//
//   var format = function(selector,update){
//     if(typeof selector === 'undefined' || selector == '*'){
//       selector = $('.core_priceFormat');
//     }else if(typeof selector === 'object'){
//       selector = selector.find('.core_priceFormat');
//     }
//
//     if(typeof update !== 'undefined' && update === true || Object.keys(this._formatSettings).length == 0){
//       this._formatSettings = {
//         money: {
//           base: S['CURRENCY'].base,
//           used: S['CURRENCY'].used.name,
//           rates: S['CURRENCY'].rates.reduce(function(object,rate){
//             object[rate.name] = rate.rate;
//             return object;
//           },{})
//         },
//         accounting: {
//           symbol: S['CURRENCY'].used.symbol,
//           format: ['£','$'].indexOf(S['CURRENCY'].used.symbol) > -1 ? '%s%v' : '%v' + String.fromCharCode(160) + '%s',
//           decimal: S['CURRENCY'].decimal.separator,
//           thousand: S['CURRENCY'].thousand == ' ' ? String.fromCharCode(160) : S['CURRENCY'].thousand,
//           precision: 2
//         }
//       };
//
//       fx.base = this._formatSettings.money.base;
//       fx.rates = this._formatSettings.money.rates;
//       accounting.settings.currency = this._formatSettings.accounting;
//     }
//
//     selector.each(function(){
//       var self = $(this);
//
//       var data = {
//         price: self.data('price'),
//         attr: self.data('price-type'),
//         type: self.data('price-type').split('|')[0],
//         show: self.data('price-type').split('|')[1],
//         value: null,
//         result: null
//       };
//
//       if(data.price === S['CURRENCY'].hurt_price.text){
//         data.value = parseFloat(data.price);
//       }else{
//         if(typeof data.attr !== 'undefined' && (data.type == 'netto' || data.type == 'netto_brutto')){
//           data.value =
//         }else{
//           data.value = parseFloat(data.price);
//         }
//
//         data.result = accounting.formatMoney(
//           fx.convert(data.value,{
//             from: this._formatSettings.money.base,
//             to: this._formatSettings.money.used
//           })
//         );
//       }
//
//
//
//       // var self = $(this),
//       //     priceValue,
//       //     price;
//       //
//       // if(self.data('price') === data.attr('data-hurt-price-text')){
//       //   priceValue = parseFloat(self.data('price'));
//       // }else{
//       //   if(typeof self.attr('data-price-type') !== 'undefined' && (self.attr('data-price-type').split('|')[0] == 'netto' || self.attr('data-price-type').split('|')[0] == 'netto_brutto')){
//       //     priceValue = bruttoToNetto(parseFloat(self.data('price')),self.data('tax'));
//       //   }else{
//       //     priceValue = parseFloat(self.data('price'));
//       //   }
//       //
//       //   price = accounting.formatMoney(fx.convert(priceValue,{
//       //     from: pricesFormatterData.money.base,
//       //     to: pricesFormatterData.money.used
//       //   }));
//       // }
//       //
//       // if(isNaN(priceValue)){
//       //   var config = accounting.settings.currency;
//       //
//       //   if(typeof self.attr('data-tax') !== 'undefined' && data.attr('data-hurt-price-text') != ''){
//       //     price = data.attr('data-hurt-price-text');
//       //   }else{
//       //     if(data.attr('data-used').split('|')[1] == '£' || data.attr('data-used').split('|')[1] == '$'){
//       //       price = config.symbol + '-,--';
//       //     }else{
//       //       price = '-,--' + String.fromCharCode(160) + config.symbol;
//       //     }
//       //   }
//       // }
//       //
//       // if(data.attr('data-decimal-hide') == 1){
//       //   var config = accounting.settings.currency,
//       //       symbol = data.attr('data-used').split('|')[1],
//       //       based = price.split(config.decimal)[0],
//       //       decimals = price.split(config.decimal)[1].split(String.fromCharCode(160))[0];
//       //
//       //   if(decimals == '00'){
//       //     if(data.attr('data-used').split('|')[1] == '£' || data.attr('data-used').split('|')[1] == '$'){
//       //       self.text(priceTypeFormatter(based,self));
//       //     }else{
//       //       self.text(priceTypeFormatter(based + String.fromCharCode(160) + config.symbol,self));
//       //     }
//       //   }else{
//       //     self.text(priceTypeFormatter(price,self));
//       //   }
//       // }else{
//       //   self.text(priceTypeFormatter(price,self));
//       // }
//     });
//   }.bind(this);
//
//   var toBrutto = function(price,tax){
//
//   }.bind(this);
//
//   var toNetto = function(price,tax){
//
//   }.bind(this);
//
//   return {
//     format: format,
//     toBrutto: toBrutto,
//     toNetto: toNetto
//   };
// })();
//
// Prices.format();

pricesFormatter();

var carousels = {};

$(document).on('ready mousewheel DOMMouseScroll scroll touchmove',function(e){
  var scrollTop = this.documentElement.scrollTop || this.body.scrollTop,
      toTop = $('#to-top');

  if(scrollTop > 500 && !toTop.hasClass('show')){
    toTop.addClass('show');
  }else if(scrollTop <= 500 && toTop.hasClass('show')){
    toTop.removeClass('show');
  }
});

$('#to-top').on('click',function(){
  var toTop = $(this),
      scrollTop = $('html,body');

  scrollTop.animate({
    scrollTop: 0
  },'slow',function(){
    toTop.removeClass('show');
  });
});

$(document).on('click','[data-select-currency]',function(e){
  e.preventDefault();

  var self = $(this),
      used = self.data('select-currency'),
      body = $('body'),
      actives = $('[data-select-currency-active]'),
      currencyName = $('[data-select-currency-name]');

	body.attr('data-used',used);
	currencyName.text(used.split('|')[0]);
	actives.removeClass('active');

	cookies.create('currency',used.split('|')[0],365 * 24 * 60 * 60 * 1000);

  if(typeof self.attr('data-select-currency-active') !== 'undefined'){
    self.addClass('active');
  }else{
    self.parents('[data-select-currency-active]').addClass('active');
  }

  pricesFormatter('*',true);
});

$('#header')
  .on('focus','.input-field[name="q"]',function(){
    var self = $(this);

    if(self.parents('li.search').length > 0 && !self.parents('li.search').hasClass('click')){
      self.parents('li.search').addClass('click clicked');
      self.one('blur',function(){
        var self = $(this);

        if(self.parents('li.search').length > 0){
          self.parents('li.search').removeClass('click clicked');
        }
      });
    }
  });

var cartUpdateAjax = null;
var cartUpdate = function(params,callback){
  var defaultParams = {
    wait: 100,
    blockade: 0,
    hash: null,
    rendered: null
  };

  if(typeof params !== 'undefined'){
    Object.keys(params).forEach(function(key){
      defaultParams[key] = params[key];
    });

    params = defaultParams;
  }else{
    params = defaultParams;
  }

  if(params.hash !== null){
    params.hash.forEach(function(hash){
      if(SkyShop.cart.ajaxHash.indexOf(hash) == -1){
        SkyShop.cart.ajaxHash.push(hash);
      }
    });

    params.hash = SkyShop.cart.ajaxHash;
  }

  var cart = $('.cart'),
      body = $('body');

  var data = {
    security: {
      countAjax: 0,
      maxAjax: 5
    },
    shop: {
      pricesType: typeof body.data('hurt-price-type') === 'undefiend' || body.data('hurt-price-type') == '' || body.data('hurt-price-type') == 'brutto' ? 'gross' : 'net'
    }
  };

  var elements = {
    submit: cart.find('[type="submit"]'),
    loader: cart.find('.cart-loader'),
    products: {
      pattern: cart.find('.product-item-pattern'),
      patternOptions: cart.find('.product-item-pattern').find('.product-parameters-pattern'),
      table: cart.find('.cart-table'),
      tableBody: cart.find('.cart-table').children('tbody'),
      current: function(hash){
        var productElement = elements.products.tableBody.find('tr[data-hash="' + hash + '"]');

        return {
          prices: {
            price: productElement.find('.core_cartItemPrice'),
            priceDiscount: productElement.find('.core_cartItemPriceDiscount'),
            priceTotal: productElement.find('.core_cartItemPriceTotal')
          },
          parameters: {
            inline: productElement.find('.product-parameters-inline')
          }
        };
      }
    },
    code: {
      value: cart.find('input[name="code_discount"]'),
      add: cart.find('.core_addDiscountCoupon'),
      active: cart.find('.core_removeDiscountCoupon'),
      details: {
        section: cart.find('.coupon-active'),
        value: cart.find('.core_cartCouponValue')
      }
    },
    loyalty: {
      isGranted: cart.find('.core_grantedLoyaltyPoints'),
      usedPoints: cart.find('input[name="used_points"]'),
      use: cart.find('.core_useLoyaltyPoints')
    },
    gratis: {
      tableGratis: cart.find('.cart-table-gratis'),
      cartGratis: cart.find('.cart-table-gratis').find('.cart-gratis'),
      pattern: cart.find('.cart-table-gratis').find('.cart-gratis').find('tr').eq(0)
    },
    shipment: {
      missingValue: cart.find('.core_cartFreeShipment'),
      isFreeShipment: cart.find('.core_cartIsFreeShipment'),
      isFreeShipmentActive: cart.find('.core_cartIsFreeShipmentActive')
    },
    summary: {
      priceTotal: cart.find('.core_cartPriceTotal'),
      priceTotalGross: cart.find('.core_cartPriceTotalGross'),
      isPriceDiscount: cart.find('.core_cartIsPriceDiscount'),
      priceDiscount: cart.find('.core_cartPriceDiscount'),
      isPriceCoupon: cart.find('.core_cartIsPriceCoupon'),
      priceCoupon: cart.find('.core_cartPriceCoupon'),
      isPriceLoyalty: cart.find('.core_cartIsPriceLoyalty'),
      priceLoyalty: cart.find('.core_cartPriceLoyalty'),
      priceTotalWithDiscount: cart.find('.core_cartPriceTotalWithDiscount'),
      priceTotalWithDiscountNet: cart.find('.core_cartPriceTotalWithDiscountNet'),
      nettoOrderInfo: cart.find('.core_cartNettoOrderInfo')
    }
  };

  var manage = {
    submit: {
      toggleState: function(state){
        if(typeof state === 'undefined'){
          state = 'enable';
        }

        switch(state){
          case 'enable':
            cartUpdateAjax = null;

            elements.submit.removeClass('cart-disable-request');

            setTimeout(function(){
              elements.code.add.removeClass('disabled').removeAttr('disabled');
              elements.code.active.removeClass('disabled').removeAttr('disabled');
              elements.loyalty.use.removeClass('disabled').removeAttr('disabled');
            },params.blockade);

            elements.loader.removeClass('loading');

            if(elements.summary.nettoOrderInfo.hasClass('hidden')){
              elements.submit.removeClass('disabled').removeAttr('disabled');
            }
          break;
          case 'disable':
            elements.submit.addClass('disabled cart-disable-request').attr('disabled','disabled');

            elements.code.add.addClass('disabled').attr('disabled','disabled');
            elements.code.active.addClass('disabled').attr('disabled','disabled');
            elements.loyalty.use.addClass('disabled').attr('disabled','disabled');

            elements.loader.addClass('loading');
          break;
        }
      }
    },
    errors: {
      do: function(response){
        if(typeof response.user_error !== 'undefined' && typeof response.code === 'undefined' && typeof response.notice === 'undefined'){
          popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.user_error,'error');
        }else if(typeof response.user_error !== 'undefined' && typeof response.code !== 'undefined'){
          switch(response.code){
            case 'no_prods':
              popups.actionAlert(L['INFORMATION'],response.user_error,'info');

              $.get('/cart',function(cart){
                $(document).find('section.cart').html($(cart).find('section.cart').html());

                pricesFormatter($('section.cart'));
              });
            break;
          }
        }
      }
    },
    gratis: {
      remove: function(gratis){
        elements.gratis.cartGratis.find('tr[data-gratis="' + gratis + '"]').remove();
      },
      render: function(gratis){
        var gratisTemplate = elements.gratis.pattern[0].outerHTML;
            gratisTemplate = gratisTemplate.replace(/{{:id:}}/g,gratis.prod_id);
            gratisTemplate = gratisTemplate.replace(/#{{:url:}}/g,gratis.prod_url);
            gratisTemplate = gratisTemplate.replace(/{{:name:}}/g,gratis.prod_name);

            gratisTemplate = $(gratisTemplate);
            gratisTemplate.find('[data-disabled]').prop('disabled',false).removeAttr('data-disabled');
            gratisTemplate.removeClass('gratis-product-pattern hidden');

        return gratisTemplate;
      }
    },
    products: {
      options: {
        inline: {
          render: function(product){
            var countSelects = 0;

            return Object.keys(product.options)
              .filter(function(key){
                var parameter = {
                  type: product.options[key].type,
                  selected: Object.keys(product.options[key].values).some(function(valueKey){
                    return product.options[key].values[valueKey].selected != '';
                  })
                };

                return parameter.type != 'hidden';
              })
              .map(function(key){
                var parameter = {
                  name: product.options[key].name,
                  type: product.options[key].type,
                  value: product.options[key].type == 'info' ?
                    Object.keys(product.options[key].values).map(function(valueKey){
                      return product.options[key].values[valueKey].name;
                    }).join(', ')
                  :
                    product.options[key].values[Object.keys(product.options[key].values).filter(function(valueKey){
                      return product.options[key].values[valueKey].selected != '';
                    })[0]]
                };

                var parameterPattern = parameter.name + ':' + String.fromCharCode(160) + '<strong>{{:parameter_value:}}</strong>';

                if(parameter.type == 'info'){
                  parameterPattern = parameterPattern.replace(/{{:parameter_value:}}/g,[
                    parameter.value
                  ].join(''));
                }else{
                  if(typeof parameter.value !== 'undefined'){
                    parameterPattern = parameterPattern.replace(/{{:parameter_value:}}/g,[
                      parameter.value.name + (parameter.value.change_price_f_no_dis != '' ? ' (' + parameter.value.change_price_f_no_dis.slice(1) + ')' : '')
                    ].join(''));
                  }else{
                    parameterPattern = parameterPattern.replace(/{{:parameter_value:}}/g,[
                      '<span class="not-selected">' + L['NOT_SELECTED'] + '</span>'
                    ].join(''));
                  }
                }

                if(parameter.type != 'info'){
                  if(Object.keys(product.options[key].values).length > 1){
                    countSelects++;
                  }
                }

                return parameterPattern;
              }).join(', ') + (countSelects > 0 ? [' ',
                '(<a href="#" class="core_showAllParameters">',
                  L['CHANGE'],
                '</a>)'
              ].join('') : '');
          }
        },
        render: function(product){
          var optionTemplate = {
                select: elements.products.patternOptions.find('.product-parameters-select')[0].outerHTML,
                text: elements.products.patternOptions.find('.product-parameters-text')[0].outerHTML,
                all: elements.products.patternOptions.find('.product-parameters-all')[0].outerHTML
              },
              optionResults = '',
              optionCount = 0,
              stocksExist = false,
              stocksGroups = [];

          if(typeof product.stocks.stocks !== 'undefined'){
            Object.keys(product.stocks.stocks).forEach(function(key){
              var stock = product.stocks.stocks[key],
                  stockList = stock[Object.keys(stock)[0]];

              if(typeof stockList !== 'undefined'){
                stocksExist = true;

                stockList.list.forEach(function(item){
                  stocksGroups.push(parseFloat(item.op_id));
                });
              }
            });
          }

          Object.keys(product.options).forEach(function(key,i){
            var template,
                option = product.options[key];
                option.key = key;
                option.valuesKeys = Object.keys(option.values);

            switch(option.type){
              case 'choose':
                optionCount++;

                template = optionTemplate.select;
                template = template.replace(/{{:option_name:}}/g,option.name);
                template = template.replace(/{{:option_key:}}/g,key);
                template = template.replace(/{{:option_required:}}/g,option.required == 'yes' ? true : false);
                template = template.replace(/{{:option_cart_hash:}}/g,product.hash);
                template = template.replace(/{{:option_options:}}/g,option.valuesKeys.map(function(id){
                  var name = option.values[id].name,
                      selected = '';

                  if(option.values[id].change_price_f_no_dis != ''){
                    name = name + ' ' + option.values[id].change_price_f_no_dis;
                  }
                  if(option.values[id].selected){
                    if((product.amount_none == 'deny' || product.amount_none == 'hide') && stocksExist && stocksGroups.indexOf(parseFloat(option.key)) > -1){
                      selected = 'data-selected="true"';
                    }else{
                      selected = option.values[id].selected;
                    }
                  }

                  return '<option value="' + id + '" name="option_' + key + '_' + product.hash + '" ' + selected + '>' + name + '</option>';
                }).join(''));
                template = template.replace(/{{:option_values:}}/g,option.valuesKeys.map(function(id){
                  return option.values[id].name;
                }).join(', '));
                template = template.replace(/{{:option_init_select2:}}/g,'select-field-select2 core_parseOption');

                if((product.amount_none == 'deny' || product.amount_none == 'hide') && stocksExist && stocksGroups.indexOf(parseFloat(option.key)) > -1){
                  template = template.replace(/{{:option_allow_clear:}}/g,true);
                }else if(option.required == 'no'){
                  template = template.replace(/{{:option_allow_clear:}}/g,true);
                }else{
                  template = template.replace(/{{:option_allow_clear:}}/g,false);
                }

                if(option.valuesKeys.length > 1){
                  template = template.replace(/{{:option_select_show:}}/g,'');
                  template = template.replace(/{{:option_text_show:}}/g,'hidden');
                }else{
                  template = template.replace(/{{:option_select_show:}}/g,'hidden');
                  template = template.replace(/{{:option_text_show:}}/g,'');
                }
              break;
              case 'info':
                optionCount++;

                template = optionTemplate.text;
                template = template.replace(/{{:option_name:}}/g,option.name);
                template = template.replace(/{{:option_values:}}/g,option.valuesKeys.map(function(id){
                  return option.values[id].name;
                }).join(', '));
              break;
            }

            if(typeof template !== 'undefined'){
              if(optionCount > 3){
                template = template.replace(/{{:option_hidden:}}/g,'hidden');
              }else{
                template = template.replace(/{{:option_hidden:}}/g,'');
              }

              if(optionCount == 4){
                template = optionTemplate.all + template;
              }

              optionResults += template;
            }
          });

          optionResults = $(optionResults);
          optionResults.find('[data-disabled]').prop('disabled',false).removeAttr('data-disabled');

          return optionResults;
        }
      },
      update: function(product){
        var productElement = elements.products.current(product.hash);

        if(productElement.parameters.inline.length > 0){
          productElement.parameters.inline.html(manage.products.options.inline.render(product));
        }

        if(data.shop.pricesType == 'gross'){
          productElement.prices.price.data('price',product.price);
          productElement.prices.priceDiscount.data('price',product.price_with_discount);
          productElement.prices.priceTotal.data('price',product.price_with_discount_sum);
        }else{
          productElement.prices.price.data('price',product.price_net);
          productElement.prices.priceDiscount.data('price',product.price_with_discount_net);
          productElement.prices.priceTotal.data('price',product.price_with_discount_net_sum);
        }
      },
      render: function(product){
        var productTemplate = elements.products.pattern[0].outerHTML;
            productTemplate = productTemplate.replace(/{{:id:}}/g,product.id);
            productTemplate = productTemplate.replace(/{{:index:}}/g,product.index);
            productTemplate = productTemplate.replace(/{{:hash:}}/g,product.hash);
            productTemplate = productTemplate.replace(/{{:name:}}/g,product.name);
            productTemplate = productTemplate.replace(/{{:unit:}}/g,product.prod_unit);
            productTemplate = productTemplate.replace(/{{:parameters:}}/g,manage.products.options.inline.render(product));
            productTemplate = productTemplate.replace(/{{:image:}}/g,product.img);
            productTemplate = productTemplate.replace('src="/view/new/img/transparent.png"', '');
            productTemplate = productTemplate.replace(/#{{:url:}}/g,product.url);
            productTemplate = productTemplate.replace(/{{:boxamount:}}/g,product.boxamount);
            productTemplate = productTemplate.replace(/{{:boxrestrict:}}/g,product.boxrestrict);
            productTemplate = productTemplate.replace(/{{:boxrestrict_bool:}}/g,product.boxrestrict_bool);
            productTemplate = productTemplate.replace(/{{:amount:}}/g,product.amount);
            productTemplate = productTemplate.replace(/{{:datatick:}}/g,product.datatick);
            productTemplate = productTemplate.replace(/{{:datamin:}}/g,product.datamin);
            productTemplate = productTemplate.replace(/{{:datamax:}}/g,product.datamax);
            productTemplate = productTemplate.replace(/data-src/g,'src');

            if(data.shop.pricesType == 'gross'){
              productTemplate = productTemplate.replace(/{{:price:}}/g,product.price);
              productTemplate = productTemplate.replace(/{{:price_discount:}}/g,product.price_with_discount);
              productTemplate = productTemplate.replace(/{{:price_total:}}/g,product.price_with_discount_sum);
            }else{
              productTemplate = productTemplate.replace(/{{:price:}}/g,product.price_net);
              productTemplate = productTemplate.replace(/{{:price_discount:}}/g,product.price_with_discount_net);
              productTemplate = productTemplate.replace(/{{:price_total:}}/g,product.price_with_discount_net_sum);
            }

            productTemplate = $(productTemplate);
            productTemplate.find('.product-parameters-pattern').html(manage.products.options.render(product)).attr('class','product-parameters');

            if(product.amount_none == 'deny' || product.amount_none == 'hide'){
              var productStocks = {
                groups: [],
                stocks: []
              };

              if(typeof product.stocks.stocks !== 'undefined'){
                /* Get stocks groups */
                Object.keys(product.stocks.stocks).forEach(function(stocks,stocksIndex){
              		Object.keys(product.stocks.stocks[stocks]).forEach(function(stockGroups,stockGroupsIndex){
              			if(stockGroupsIndex == 0){
              				Object.keys(product.stocks.stocks[stocks][stockGroups].list).forEach(function(listGroups){
              					productStocks.groups.push(parseFloat(product.stocks.stocks[stocks][stockGroups].list[listGroups].op_id));
              				});
                    }
              		});
                });

                /* Get stocks stocks */
                Object.keys(product.stocks.stocks).forEach(function(stocks,stocksIndex){
                  Object.keys(product.stocks.stocks[stocks]).forEach(function(stock,stockIndex){
                    var item = {
                      'items': [],
                      'amount': parseFloat(product.stocks.stocks[stocks][stock].sp_amount)
                    };

                    Object.keys(product.stocks.stocks[stocks][stock].list).forEach(function(list,listIndex){
                      item.items.push({
                        'option_id': parseFloat(product.stocks.stocks[stocks][stock].list[list].ov_id),
                        'option_name': product.stocks.stocks[stocks][stock].list[list].ov_name,
                        'group_id': parseFloat(product.stocks.stocks[stocks][stock].list[list].op_id),
                        'group_name': product.stocks.stocks[stocks][stock].list[list].op_name
                      });
                    });

                    productStocks.stocks.push(item);
                  });
                });
              }

              var productStocksTemplate = {
                'groups': productStocks.groups,
                'stocks': productStocks.stocks
              };

              productTemplate.find('[data-stocks-pattern]').attr('data-stocks',JSON.stringify(productStocksTemplate)).removeAttr('data-stocks-pattern');
            }else{
              productTemplate.find('[data-stocks-pattern]').removeAttr('data-stocks-pattern');
            }

            initializeSelect2(productTemplate.find('.select-field-select2'));

            productTemplate.find('[data-disabled]').prop('disabled',false).removeAttr('data-disabled');
            productTemplate.removeClass('product-item-pattern hidden');

        return productTemplate;
      }
    }
  };

  var url = '/cart/?json=1&rebuild=1';

  if(typeof cartUpdateAjax === 'number'){
    clearTimeout(cartUpdateAjax);
  }

  cartUpdateAjax = setTimeout(function(){
    $.ajax({
      type: 'POST',
      url: url,
      data: {
        time: Date.now(),
        products: $.base64Encode(JSON.stringify(SkyShop.cart.products)),
        hash: params.hash,
        code: cookies.read('ac_code'),
        loyalty: cookies.read('ac_loyalty')
      },
      dataType: 'json',
      beforeSend: function(){
        manage.submit.toggleState('disable');
      },
      success: function(response){
        if(typeof response.user_error === 'undefined' && typeof response.notice === 'undefined'){
          SkyShop.cart.ajaxHash = [];

          Object.keys(response).forEach(function(action){
            var rsp = response[action];
            // console.log('rsp')
            // console.log(rsp)

            switch(action){
              case 'products':
                var discounts = 0;

                Object.keys(rsp).forEach(function(hash,index){
                  var product = rsp[hash];
                      product.hash = hash;
                      product.index = index + 1;
                      product.datamax = product.prod_amount <= 0 && product.amount_none != 'denny' || (product.prod_amount > 0 && product.amount_none == 'allow') ? 524288 : product.prod_amount;
                      // console.log('product')
                      // console.log(product)

                  if(data.shop.pricesType == 'gross'){
                    if(product.price > product.price_with_discount){
                      discounts++;
                    }
                  }else{
                    if(product.price_net > product.price_with_discount_net){
                      discounts++;
                    }
                  }

                  if(elements.products.tableBody.find('tr[data-hash="' + product.hash + '"]').length > 0){
                    manage.products.update(product);
                  }else{
                    elements.products.tableBody.append(manage.products.render(product));
                  }
                });

                if(discounts > 0){
                  elements.products.table.find('.product-discount').removeClass('hidden');
                }else{
                  elements.products.table.find('.product-discount').addClass('hidden');
                }

                if(params.rendered != null){
                  params.rendered();
                }
              break;
              case 'details':
                if(rsp.min_ord_price.net > 0 && rsp.sum_net < rsp.min_ord_price.net){
                  elements.summary.nettoOrderInfo.removeClass('hidden');
                }else{
                  elements.summary.nettoOrderInfo.addClass('hidden');
                }

                if(data.shop.pricesType == 'gross'){
                  elements.summary.priceTotal.data('price',rsp.sum_prev);
                }else{
                  elements.summary.priceTotal.data('price',rsp.sum_prev_net);
                  elements.summary.priceTotalGross.data('price',rsp.sum_prev);
                }

                elements.summary.priceTotalWithDiscount.data('price',rsp.sum);
                elements.summary.priceTotalWithDiscountNet.data('price',rsp.sum_net);
              break;
              case 'discounts':
                Object.keys(rsp).forEach(function(type){
                  var discount = rsp[type];

                  switch(type){
                    case 'group':
                      if(discount.sum > 0){
                        elements.summary.priceDiscount.data('price',discount.sum);
                        elements.summary.isPriceDiscount.removeClass('hidden');
                      }else{
                        elements.summary.priceDiscount.data('price',0);
                        elements.summary.isPriceDiscount.addClass('hidden');
                      }
                    break;
                    case 'code':
                      elements.code.details.value.data('price',discount.sum);
                      elements.summary.priceCoupon.data('price',discount.sum);
                    break;
                    case 'loyalty':
                      if(discount.used_points_to_price > 0){
                        elements.summary.priceLoyalty.data('price',discount.used_points_to_price);
                        elements.summary.isPriceLoyalty.removeClass('hidden');
                      }else{
                        elements.summary.priceLoyalty.data('price',0);
                        elements.summary.isPriceLoyalty.addClass('hidden');
                      }

                      if(elements.loyalty.isGranted.data('granted') === false && discount.used_points_to_price > 0){
                        elements.loyalty.isGranted.html(L['NOT_AWARD_NEW_POINTS']);
                      }else{
                        elements.loyalty.isGranted.html(L['AFTER_YOU_PAY_THE_ORDER_WILL_RECEIVE'].replace('[POINTS]',discount.get_point_in_order));
                      }

                      elements.loyalty.usedPoints.val(discount.used_points);
                      elements.loyalty.usedPoints.attr('data-max',discount.max_used_points);
                      cookies.create('ac_loyalty',discount.used_points,0);
                    break;
                  }
                });
              break;
              case 'code':
                if(rsp.user_error == ''){
                  elements.code.value.addClass('input-disabled').attr('readonly','readonly').val(cookies.read('ac_code'));
                  elements.code.add.addClass('hidden');
                  elements.code.active.removeClass('hidden');
                  elements.code.details.section.removeClass('hidden');
                  elements.summary.isPriceCoupon.removeClass('hidden');

                  if(typeof callback !== 'undefined'){
                    callback();
                  }
                }else if(rsp.length == 0){
                  elements.code.value.removeClass('input-disabled').removeAttr('readonly').val('');
                  elements.code.add.removeClass('hidden');
                  elements.code.active.addClass('hidden');
                  elements.code.details.section.addClass('hidden');
                  elements.summary.isPriceCoupon.addClass('hidden');
                }else{
                  popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],rsp.user_error,'error');
                  cookies.erase('ac_code');
                  elements.code.value.val('');
                }
              break;
              case 'shipments':
                if(typeof rsp.free === 'undefined'){
                  elements.shipment.isFreeShipment.addClass('hidden');
                  elements.shipment.isFreeShipmentActive.addClass('hidden');
                }else{
                  if(rsp.free.price > 0){
                    elements.shipment.missingValue.data('price',rsp.free.price);
                    elements.shipment.isFreeShipment.removeClass('hidden');
                    elements.shipment.isFreeShipmentActive.addClass('hidden');
                  }else{
                    elements.shipment.isFreeShipment.addClass('hidden');
                    elements.shipment.isFreeShipmentActive.removeClass('hidden');
                  }
                }
              break;
              case 'gratis':
                if(rsp != null && Object.keys(rsp).length > 0){
                  var gratisData = {
                    exists: [],
                    used: []
                  };

                  elements.gratis.cartGratis.find('tr').slice(1).each(function(){
                    gratisData.exists.push(
                      parseFloat($(this).data('gratis'))
                    );
                  });

                  Object.keys(rsp).forEach(function(id){
                    var gratis = rsp[id];
                        gratisData.used.push(
                          parseFloat(gratis.prod_id)
                        );

                    if(gratisData.exists.indexOf(parseFloat(gratis.prod_id)) == -1){
                      elements.gratis.cartGratis.append(manage.gratis.render(gratis));
                    }
                  });

                  gratisData.exists.filter(function(gratis){
                    return gratisData.used.indexOf(gratis) == -1;
                  }).forEach(function(id){
                    manage.gratis.remove(id);
                  });

                  if(elements.gratis.tableGratis.css('display') == 'none'){
                    elements.gratis.tableGratis.transition('slideDown',100);
                  }
                }else{
                  if(elements.gratis.tableGratis.css('display') != 'none'){
                    elements.gratis.tableGratis.transition('slideUp',100,function(){
                      elements.gratis.cartGratis.find('tr').slice(1).remove();
                    });
                  }
                }
              break;
            }
          });

          pricesFormatter(cart);

          manage.submit.toggleState('enable');
        }else{
          if(typeof response.notice !== 'undefined'){
            data.security.countAjax++;

            if(data.security.countAjax >= data.security.maxAjax){
              manage.submit.toggleState('enable');
              manage.errors.do(response);
            }else{
              $.ajax(this);
            }
          }else if(typeof response.user_error !== 'undefined'){
            manage.submit.toggleState('enable');
            manage.errors.do(response);
          }
        }
      },
      error: function(response){
        data.security.countAjax++;

        if(data.security.countAjax >= data.security.maxAjax){
          manage.submit.toggleState('enable');
          manage.errors.do(response);
        }else{
          $.ajax(this);
        }
      }
    });
  },params.wait);
};

var orderCalculate = function(){
  var order = $('.order'),
      orderPreview = order.find('.order-preview');

  var orderPriceItems = 0,
      orderPriceDiscount = 0,
      orderPriceCoupon = 0,
      orderPriceLoyalty = 0,
      orderPriceShipment = 0,
      orderPriceOverhead = 0,
      orderPriceOverheadValue = 0,
      orderPriceTotal = 0;

  var orderInner = {
    priceItems: orderPreview.find('.core_orderPriceItems'),
    priceDiscount: orderPreview.find('.core_orderPriceDiscount'),
    priceCoupon: orderPreview.find('.core_orderPriceCoupon'),
    priceLoyalty: orderPreview.find('.core_orderPriceLoyalty'),
    priceShipment: orderPreview.find('.core_orderPriceShipment'),
    priceOverhead: orderPreview.find('.core_orderPriceOverhead'),
    priceIsOverhead: orderPreview.find('.core_orderIsPriceOverhead'),
    priceTotal: orderPreview.find('.core_orderPriceTotal')
  };

  if(orderInner.priceItems.length > 0){
    orderPriceItems = orderInner.priceItems.data('price');
  }
  if(orderInner.priceDiscount.length > 0){
    orderPriceDiscount = orderInner.priceDiscount.data('price');
  }
  if(orderInner.priceCoupon.length > 0){
    orderPriceCoupon = orderInner.priceCoupon.data('price');
  }
  if(orderInner.priceLoyalty.length > 0){
    orderPriceLoyalty = orderInner.priceLoyalty.data('price');
  }
  if(typeof SkyShop.order.shipmentPrice !== 'undefined'){
    if(SkyShop.order.shipmentPrice === null){
      orderPriceShipment = 0;
    }else{
      orderPriceShipment = SkyShop.order.shipmentPrice;
      orderInner.priceShipment.data('price',orderPriceShipment);
    }
  }

  orderPriceTotal = Big(orderPriceItems).minus(orderPriceDiscount).minus(orderPriceCoupon).minus(orderPriceLoyalty).plus(orderPriceShipment);

  if(typeof SkyShop.order.overheadValue !== 'undefined'){
    orderPriceOverhead = SkyShop.order.overheadValue != '0.00' ? parseFloat(SkyShop.order.overheadValue) : 0;
    orderPriceOverheadValue = Big(Big(orderPriceOverhead).div(100)).times(orderPriceTotal);

    if(orderPriceOverhead > 0){
      orderInner.priceOverhead.data('price',orderPriceOverheadValue);
      orderInner.priceIsOverhead.removeClass('hidden');
    }else{
      orderInner.priceOverhead.data('price',0);
      orderInner.priceIsOverhead.addClass('hidden');
    }

    orderPriceTotal = Big(orderPriceTotal).plus(orderPriceOverheadValue);
  }

  orderInner.priceTotal.data('price',orderPriceTotal);

  pricesFormatter(orderPreview);
};

var orderRenderDeliveries = function(methods){
  var order = $('.order');

  var data = {
    methods: function(methods){
      var sortedMethods = {},
          selectedMethod = cookies.read('ac_shipment') != null && Object.keys(methods).indexOf(cookies.read('ac_shipment')) > -1 ? cookies.read('ac_shipment') : null;

      Object.keys(methods).filter(function(key){
        var method = methods[key];

        return method.function == 'none' || (method.function != 'none' && (method.methods !== false && Object.keys(method.methods).length > 0));
      }).forEach(function(key){
        var method = methods[key];

        if(typeof sortedMethods[method.order] !== 'undefined'){
          method.order = Math.floor(Math.random() * (1000-100+1) + 100).toString();
        }

        sortedMethods[method.order] = method;
        sortedMethods[method.order].uniqueId = key;
      });

      return {
        sorted: sortedMethods,
        selected: selectedMethod
      };
    }
  };

  var elements = {
    deliveries: order.find('#order-deliverys-methods'),
    empty: order.find('#order-deliverys-methods-empty'),
    error: order.find('#order-deliverys-methods-error'),
    methods: {
      container: order.find('#order-deliverys-methods').children('tbody'),
      all: order.find('#order-deliverys-methods').children('tbody').children('tr').not('[class*="pattern"]'),
      pattern: order.find('#order-deliverys-methods').children('tbody').children('.delivery-method-pattern'),
      patternMore: order.find('#order-deliverys-methods').children('tbody').children('.delivery-method-more-pattern')
    }
  };

  var manage = {
    methods: {
      render: function(method,selected,i){
        var isSelected = (selected != null && selected == method.uniqueId) || (selected == null && i == 0);

        var deliveryTemplate = elements.methods.pattern[0].outerHTML;
            deliveryTemplate = deliveryTemplate.replace(/{{:id:}}/g,method.uniqueId);
            deliveryTemplate = deliveryTemplate.replace(/{{:name:}}/g,method.name);
            deliveryTemplate = deliveryTemplate.replace(/{{:description:}}/g,method.desc);
            deliveryTemplate = deliveryTemplate.replace(/{{:cost:}}/g,method.price);

            if(method.personal == 'yes'){
              deliveryTemplate = deliveryTemplate.replace(/{{:shipment_type:}}/g,'personal');
            }else{
              deliveryTemplate = deliveryTemplate.replace(/{{:shipment_type:}}/g,'delivery');
            }
            if(method.require_address == 'yes'){
              deliveryTemplate = deliveryTemplate.replace(/{{:require_address:}}/g,'shipmentRequired');
            }else{
              deliveryTemplate = deliveryTemplate.replace(/{{:require_address:}}/g,'');
            }

            deliveryTemplate = $(deliveryTemplate);
            deliveryTemplate.removeClass('delivery-method-pattern').css('display','none').removeClass('hidden');

            if(isSelected){
              SkyShop.order.shipmentSelected = method.uniqueId;

              deliveryTemplate.addClass('active');
              deliveryTemplate.attr('data-auto-selected',true);
              deliveryTemplate.find('input[name="shipment"]').prop('checked',true);
            }

            if(method['function'] != 'none'){
              deliveryTemplate.addClass('core_getOrderShipmentsSpecial');
              deliveryTemplate.attr('data-key',method.uniqueId);
              deliveryTemplate = $().add(deliveryTemplate).add(
                $(elements.methods.patternMore[0].outerHTML)
                  .removeClass('delivery-method-more-pattern')
                  .css('display',isSelected ? 'table-row' : 'none')
                  .css('opacity',isSelected ? 1 : 0)
                  .addClass(isSelected ? 'open' : '')
                  .removeClass('hidden')
              );
            }

        return deliveryTemplate;
      }
    },
    error: {
      render: function(){
        var message = elements.error.text().replace(/{{:error:}}/g,methods.user_error);

        elements.error.text(message);
      }
    }
  };

  if(typeof methods.user_error === 'undefined'){
    removeError(elements.empty);

    $().add(elements.error).add(elements.empty).transition('fadeOut',200);

    methods = data.methods(methods);

    setTimeout(function(){
      elements.methods.all = order.find('#order-deliverys-methods').children('tbody').children('tr').not('[class*="pattern"]');
      elements.methods.all.remove();

      Object.keys(methods.sorted).forEach(function(key,i){
        elements.methods.container.append(
          manage.methods.render(methods.sorted[key],methods.selected,i)
        );
      });

      elements.methods.all = order.find('#order-deliverys-methods').children('tbody').children('tr').not('[class*="pattern"]');
      elements.methods.all.each(function(){
        if($(this).data('auto-selected') === true){
          $(this).trigger('click',{
            updateCookie: false
          });
        }
      });

      pricesFormatter(elements.methods.all);

      $().add(elements.deliveries).add(elements.methods.all.not('.more')).transition('fadeIn',200);
    },180);
  }else{
    removeError(elements.empty);

    $().add(elements.deliveries).add(elements.empty).transition('fadeOut',200);

    setTimeout(function(){
      manage.error.render();
      elements.error.transition('fadeIn',200);
    },180);
  }
};

var popups = {
  addToCart: function(callback){
    swal({
      width: 650,
      customClass: 'swal-shop-action-popup',
      confirmButtonText: L['CONTINUE_SHOPPING'],
      confirmButtonClass: 'btn',
      showCancelButton: true,
      cancelButtonText: L['MAKE_ORDER'],
      cancelButtonClass: 'btn',
      title: L['PRODUCT_ADDED'],
      type: 'success',
      html: L['PRODUCT_ADDED_E_AMOUNT']
    }).then(function(){
			if(callback){
        callback();
      }
		},function(){
      window.location = '/cart/';
    });

    $('.swal-shop-action-popup').find('.btn').blur();
  },
  actionAlert: function(title,content,type,callback){
    swal({
      width: 550,
      customClass: 'swal-shop-action-popup',
      confirmButtonText: 'OK',
      confirmButtonClass: 'btn',
      title: title,
      type: type,
      html: content
    }).then(function(){
			if(callback){
        callback();
      }
		});
  },
  yesNo: function(title,content,type,callbackYes,callbackNo){
    swal({
      width: 550,
      customClass: 'swal-shop-action-popup',
      confirmButtonText: L['YES'],
      confirmButtonClass: 'btn',
      showCancelButton: true,
      cancelButtonText: L['NO'],
      cancelButtonClass: 'btn',
      title: title,
      type: type,
      html: content
    }).then(function(){
			if(callbackYes){
        callbackYes();
      }
		},function(){
      if(callbackNo){
        callbackNo();
      }
    });
  },
  newsletter: function(content){
    if(window.innerWidth >= 800){
      swal({
        width: 800,
        customClass: 'swal-shop-newsletter-popup',
        confirmButtonText: 'OK',
        confirmButtonClass: 'btn',
        title: 'Newsletter',
        type: 'info',
        html: [
          '<div class="container-fluid" style="background-image:url(/' + S['UPLOAD_PATH'] + '/newsletter-popup.jpg);background-size:cover;">',
            '<div class="row">',
              '<div class="col-xs-12">',
                '<div>',
                  content,
                  '<form class="newsletter-form core_addEmailToNewsletterPopup" data-valid-box>',
                    '<div class="row">',
                      '<div class="col-xxs col-xs-7 col-md-8">',
                        '<input type="text" name="email" value="" placeholder="' + L['INPUT_EMAIL'] + '" class="newsletter-input" data-valid="required|email" />',
                      '</div>',
                      '<div class="col-xxs col-xs-5 col-md-4">',
                        '<input type="submit" value="' + L['ADD_ADDRESS'] + '" class="btn newsletter-button core_addEmailToNewsletterPopup" />',
                        '<input type="hidden" value="1" class="pro-tecting-_-Input" name="is_js">',
                      '</div>',
                    '</div>',
                  '</form>',
                '</div>',
                '<i class="close-shape"></i>',
              '</div>',
            '</div>',
          '</div>'
        ].join('')
      });

      $(document).on('click','.swal-shop-newsletter-popup .close-shape',function(){
        $('.swal-shop-newsletter-popup').find('.swal2-confirm').trigger('click');
      });
    }
  },
  askAboutProduct: function(productId){
    swal({
      width: 800,
      customClass: 'swal-shop-ask-about-product-popup',
      confirmButtonText: 'OK',
      confirmButtonClass: 'btn',
      title: L['ASQ_QUESTION'],
      type: null,
      html: [
        '<i class="close-shape"></i>',
        '<section class="product-opinions">',
          '<form method="POST">',
            '<table class="product-add-opinion">',
              '<tbody>',
                '<tr>',
                  '<td>',
                    '<span class="parameter-name">' + L['SIGNATURE'] + '</span>',
                  '</td>',
                  '<td>',
                    '<input class="input-field" type="text" value="' + S['USER'].name + '" placeholder="" name="username" data-valid="required" />',
                  '</td>',
                '</tr>',
                '<tr>',
                  '<td>',
                    '<span class="parameter-name">E-mail</span>',
                  '</td>',
                  '<td>',
                    '<input class="input-field" type="text" value="' + S['USER'].email + '" placeholder="" name="email" data-valid="required|email" />',
                  '</td>',
                '</tr>',
                '<tr>',
                  '<td>',
                    '<span class="parameter-name">' + L['ASQ_QUESTION'] + '</span>',
                  '</td>',
                  '<td>',
                    '<textarea class="textarea-field" rows="4" name="text" data-valid="required"></textarea>',
                    '<input type="hidden" value="1" class="pro-tecting-_-Input" name="is_js"/>',
                  '</td>',
                '</tr>',
              '</tbody>',
            '</table>',
            '<div class="col-xs-12">',
              '<button class="btn btn-primary btn-lg btn-opinion-add core_askQuestion" data-product-id="' + productId + '">' + L['SEND'] + '</button>',
            '</div>',
          '</form>',
        '</section>'
      ].join('')
    });
    
    $(document).on('click','.swal-shop-ask-about-product-popup .close-shape',function(){
      $('.swal-shop-ask-about-product-popup').find('.swal2-confirm').trigger('click');
    });
  }
};

var cookies = {
  create: function(name,value,ms){
    var expires = '';
    if(ms){
      var date = new Date();
      date.setTime(date.getTime() + ms);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
  },
  read: function(name){
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for(var i=0;i<ca.length;i++){
      var c = ca[i];
      while(c.charAt(0)==' '){
        c = c.substring(1,c.length);
      }
      if(c.indexOf(nameEQ) == 0){
        return c.substring(nameEQ.length,c.length);
      }
    }
    return null;
  },
  erase: function(name){
    cookies.create(name,'',-1);
  }
};

$('.cookies').each(function(){
  var clone = $(this).clone();

  $(this).remove();

  $('body > .fixed-elements').append($(clone));
  $('.cookies').removeClass('hidden');
});

var addError = function(elem,content){
  var element = elem,
      style = getComputedStyle(element.get(0));

  if(typeof content === 'undefined'){
    content = L['ERROR_UNEXPECTED_ERROR'];
  }

  if(!element.prev().hasClass('ss-error-container')){
    element.addClass('ss-error');
    element.before(
       '<div class="ss-error-container">'
     + '<div class="ss-error-help-open" data-toggle="popover" data-content="' + content + '">'
     + '<i class="fa fa-exclamation" aria-hidden="true"></i>'
     + '</div>'
     + '</div>'
    );
    element.prev().css({
      width: style.width,
      height: style.height,
      marginTop: style.marginTop,
      marginRight: style.marginRight,
      marginBottom: style.marginBottom,
      marginLeft: style.marginLeft
    });
    element.prev().find('[data-toggle="popover"]').popover({
      title: '',
      placement: 'top',
      container: 'body',
      trigger: 'hover',
      template: '<div class="popover ss-error-popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
      html: true
    });
  }else{
    element.prev().find('[data-toggle="popover"]').attr('data-content',content);
  }
}

var removeError = function(elem){
  var element = elem,
      prev = element.prev();

  if(prev.hasClass('ss-error-container')){
    prev.find('[data-toggle="popover"]').popover('destroy');
    prev.remove();
  }
  element.removeClass('ss-error');
}

var removeAllErrors = function(elem){
  var element;

  if(typeof elem !== 'unefined'){
    element = elem.find('.ss-error');
  }else{
    element = $('.ss-error');
  }

  var prev = element.prev();

  if(prev.hasClass('ss-error-container')){
    prev.find('[data-toggle="popover"]').popover('destroy');
    prev.remove();
  }
  element.removeClass('ss-error');
}

var recalculateErrors = function(){
  var element = $('.ss-error');

  if(element.length > 0){
    element.each(function(){
      var prev = $(this).prev(),
          style = getComputedStyle($(this).get(0));

      prev.css({
        width: style.width,
        height: style.height,
        marginTop: style.marginTop,
        marginRight: style.marginRight,
        marginBottom: style.marginBottom,
        marginLeft: style.marginLeft
      });
    });
  }
}

var updateCart = function(action,data,additionalData){
  var body = $('body'),
      quickCart = $('.quick-cart'),
      quickCartProducts = quickCart.find('.products'),
      quickCartEmptyCart = quickCart.find('.cart-empty'),
      amount = quickCart.find('.core_quickCartAmount'),
      totalPrice = quickCart.find('.core_quickCartTotalPrice'),
      totalPriceBrutto = quickCart.find('.core_quickCartTotalPriceBrutto');

  switch(action){
    case 'add':
      var productTemplate = quickCartProducts.find('.product-template')[0].outerHTML,
          existProduct = quickCartProducts.find('li[data-hash="' + data.hash + '"]');

      var productAmount = existProduct.length > 0 ? Big(existProduct.data('amount')).plus(data.amount) : data.amount;

      productTemplate = productTemplate.replace(/{{:hash:}}/g,data.hash);
      productTemplate = productTemplate.replace(/{{:amount:}}/g,productAmount);
      productTemplate = productTemplate.replace(/#{{:url:}}/g,data.url);
      productTemplate = productTemplate.replace(/{{:name:}}/g,data.name);
      productTemplate = productTemplate.replace(/{{:image:}}/g,data.img);
      productTemplate = productTemplate.replace('src="/view/new/img/transparent.png"', '');
      productTemplate = productTemplate.replace(/{{:price:}}/g,data.price);
      productTemplate = productTemplate.replace(/{{:tax:}}/g,data.tax);
      productTemplate = productTemplate.replace(/data-src/g,'src');
      productTemplate = productTemplate.replace(/data-price-type-placeholder/g,'data-price-type');
      productTemplate = $(productTemplate);
      productTemplate.removeClass('hidden');

      if(existProduct.length > 0){
        existProduct.before(productTemplate);
        existProduct.remove();
      }else{
        quickCartProducts.append(productTemplate);

        quickCartProducts.removeClass('hidden');
        quickCartEmptyCart.addClass('hidden');
      }

      amount.text(data.amount_total);
      if(body.attr('data-hurt-price-type') == 'netto_brutto' || body.attr('data-hurt-price-type') == 'netto'){
        totalPrice.text(data.sum_net);
        totalPrice.data('price',data.sum_net);
        totalPriceBrutto.text(data.sum);
        totalPriceBrutto.data('price',data.sum);
      }else{
        totalPrice.text(data.sum);
        totalPrice.data('price',data.sum);
      }

      pricesFormatter(quickCart);
    break;
    case 'remove':
      var currentProduct = quickCartProducts.find('li[data-hash="' + additionalData.hash + '"]');

      currentProduct.transition('slideUp',100,function(){
        currentProduct.remove();

        quickCartProducts.each(function(){
          if(typeof $(this).children('li')[1] === 'undefined'){
            amount.text(0);
            totalPrice.text(0);
            totalPrice.data('price',0);
            totalPriceBrutto.text(0);
            totalPriceBrutto.data('price',0);

            quickCartProducts.transition('slideUp',25,function(){
              quickCartProducts.css('display','block');
              quickCartProducts.addClass('hidden');
              quickCartEmptyCart.removeClass('hidden');
            });
          }else{
            amount.text(data.amount_total);
            if(body.attr('data-hurt-price-type') == 'netto_brutto' || body.attr('data-hurt-price-type') == 'netto'){
              totalPrice.text(data.sum_net);
              totalPrice.data('price',data.sum_net);
              totalPriceBrutto.text(data.sum);
              totalPriceBrutto.data('price',data.sum);
            }else{
              totalPrice.text(data.sum);
              totalPrice.data('price',data.sum);
            }
          }
        });

        pricesFormatter(quickCart);
      });

      if(additionalData.inCart === true){
        var cart = $('.cart'),
            cartTable = cart.find('.cart-table'),
            cartTr = cartTable.find('tr[data-hash="' + additionalData.hash  + '"]'),
            cartTrAmount = parseFloat(cartTr.find('.core_storeCartProductAmount').val()),
            cartEmpty = cartTable.prev();

        amount.text(Big(parseFloat(amount.eq(0).text())).minus(cartTrAmount));

        if(body.attr('data-hurt-price-type') == 'netto_brutto' || body.attr('data-hurt-price-type') == 'netto'){
          totalPrice.text(data.sum_net);
          totalPrice.data('price',data.sum_net);
          totalPriceBrutto.text(data.sum);
          totalPriceBrutto.data('price',data.sum);
        }else{
          totalPrice.text(data.sum);
          totalPrice.data('price',data.sum);
        }

        pricesFormatter(quickCart);

        cartTr.children('td').wrapInner('<div style="display:block;" />').parent().find('td > div').transition('slideUp',100,function(){
          cartTr.remove();

          delete SkyShop.cart.products[additionalData.hash];

          if(typeof additionalData.callback !== 'undefined'){
            additionalData.callback();
          }

          if(cartTable.find('tr[data-hash]:not(.hidden)').length == 0){
            cart.find('tbody').addClass('empty-space');
            setTimeout(function(){
              cartEmpty.removeClass('hidden');
            },200);
          }
        });
      }
    break;
  }
}

var slidersResize = function(sliders){
  sliders.each(function(){
    var self = $(this),
        carousel = self.find('.carousel').eq(0);

    var data = {
      maxWidth: self.data('max-width'),
      maxHeight: self.data('max-height'),
      currentWidth: carousel.width();
    };

    if(data.currentWidth < data.maxWidth){
      data.maxHeight = Big(Big(data.currentWidth).div(data.maxWidth)).times(data.maxHeight);
    }

    $().add(carousel).add(carousel.find('.item')).css('height',data.maxHeight);
  });
}

window.addEventListener('resize',function(event){
  recalculateErrors();
});

$('#header').find('.menu').find('li.click').children('a').on('click',function(e){
  e.preventDefault();

  var self = $(this),
      click = self.parent(),
      menu = click.parents('.menu').eq(0),
      dropdown = click.children('.dropdown'),
      outside = $(window);

  if(!click.hasClass('clicked')){
    if(menu.find('li.clicked').length > 0){
      outside.off('click.menuClose');
      menu.find('li.clicked').removeClass('clicked');
    }

    outside.on('click.menuClose',function(e){
      if(!$(e.target).closest(click).length){
        outside.off('click.menuClose');
        click.removeClass('clicked');
      }
    });

    click.addClass('clicked');

    // dropdown.on('mouseleave',function(){
    //   outside.off('click.menuClose');
    //   click.removeClass('clicked');
    // });
  }else{
    outside.off('click.menuClose');
    click.removeClass('clicked');
  }
});

$('#footer').find('.section-title').not('.center').on('click',function(){
  var self = $(this),
      menu = self.next();

  if(window.innerWidth <= 767){
    if(self.hasClass('open')){
      self.removeClass('open');
      menu.slideUp(200);
    }else{
      self.addClass('open');
      menu.slideDown(200);
    }
  }
});

var loginFacebook = function(){
	FB.getLoginStatus(function(response){
		var data = {
			getApi: '/me?fields=email,first_name,last_name'
		};
		FB.getLoginStatus(function(response){
			if(response.status === 'connected'){
				FB.api(data.getApi,function(rsp){
					$.ajax({
						type: 'GET',
						url: '/login/service/facebook?email=' + rsp.email + '&first_name=' + rsp.first_name + '&last_name=' + rsp.last_name + '&id=' + rsp.id,
						success: function(data){
							if(JSON.parse(data).success == true){
								window.location = '/';
							}else{
								popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['LOGIN_SERVICE_NO_VALIDATE'],'error');
							}
						}
					});
				});
			}else{
				popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['LOGIN_SERVICE_NO_VALIDATE'],'error');
			}
		});
	});
};

window.onbeforeunload = function(e){
  if(typeof gapi !== 'undefined' && gapi && gapi.auth2){
	  gapi.auth2.getAuthInstance().signOut();
  }
};

var loginGoogle = function(googleUser){
	var profile = googleUser.getBasicProfile();

	var data = {
		email: profile.getEmail(),
		firstName: profile.getGivenName(),
		lastName: profile.getFamilyName(),
		id: googleUser.getAuthResponse().id_token
	};

	if(profile && data.id){
		$.ajax({
			type: 'GET',
			url: '/login/service/google?email=' + data.email + '&first_name=' + data.firstName + '&last_name=' + data.lastName + '&id=' + data.id,
			success: function(data){
				if(JSON.parse(data).success == true){
					window.location = '/';
				}else{
					popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['LOGIN_SERVICE_NO_VALIDATE'],'error');
				}
			}
		});
	}else{
		popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['LOGIN_SERVICE_NO_VALIDATE'],'error');
	}
};

var createSwipePanelCount = 0;
var createSwipePanel = function(direction,additionalClass,callback,callbackClose){
  var fixedElements = $('body').children('.fixed-elements');
      swipePanel = fixedElements.find('.swipe-panel'),
      swipePanelContent = swipePanel.children('.swipe-panel-content'),
      swipePanelCloseArea = swipePanel.children('.swipe-panel-close-area');
      swipePanel.data('direction',direction);
      swipePanel.addClass('open');
      swipePanelContent.attr('class','swipe-panel-content');
      swipePanelContent.empty();
      swipePanelContent.addClass(additionalClass);
      swipePanelContent.addClass(direction);
      swipePanelCloseArea.addClass(direction);

      if(createSwipePanelCount == 0){
        createSwipePanelCount++;

        swipePanelCloseArea.on('click',function(){
          var direction = swipePanel.data('direction'),
              swipePanelContentWidth = swipePanelContent.width();

          if(direction == 'left'){
            if(typeof $(document).velocity !== 'undefined'){
              swipePanelContent.velocity({
                left: -swipePanelContentWidth
              },200,function(){
                swipePanelContent.attr('style','');
                swipePanelContent.attr('class','swipe-panel-content');
                setTimeout(function(){
                  swipePanel.removeClass('open');
                  swipePanelCloseArea.attr('class','swipe-panel-close-area');
                  if(typeof callbackClose !== 'undefined'){
                    callbackClose(swipePanelContent);
                  }
                },200);
              });
            }else{
              swipePanelContent.animate({
                left: -swipePanelContentWidth
              },200,function(){
                swipePanelContent.attr('style','');
                swipePanelContent.attr('class','swipe-panel-content');
                setTimeout(function(){
                  swipePanel.removeClass('open');
                  swipePanelCloseArea.attr('class','swipe-panel-close-area');
                  if(typeof callbackClose !== 'undefined'){
                    callbackClose(swipePanelContent);
                  }
                },200);
              });
            }
          }else{
            if(typeof $(document).velocity !== 'undefined'){
              swipePanelContent.velocity({
                right: -swipePanelContentWidth
              },200,function(){
                swipePanelContent.attr('style','');
                swipePanelContent.attr('class','swipe-panel-content');
                setTimeout(function(){
                  swipePanel.removeClass('open');
                  swipePanelCloseArea.attr('class','swipe-panel-close-area');
                  if(typeof callbackClose !== 'undefined'){
                    callbackClose(swipePanelContent);
                  }
                },200);
              });
            }else{
              swipePanelContent.animate({
                right: -swipePanelContentWidth
              },200,function(){
                swipePanelContent.attr('style','');
                swipePanelContent.attr('class','swipe-panel-content');
                setTimeout(function(){
                  swipePanel.removeClass('open');
                  swipePanelCloseArea.attr('class','swipe-panel-close-area');
                  if(typeof callbackClose !== 'undefined'){
                    callbackClose(swipePanelContent);
                  }
                },200);
              });
            }
          }
        });

        new Touchy(swipePanel[0],true,function(hand,finger){
          if(hand.fingers.length > 1){
            return;
          }

          var swipePanelContentWidth = swipePanelContent.width(),
              waitDistance = 30,
              distance = {
                start: null,
                current: 0
              },
              durationMax = 200,
              duration,
              direction;

          finger.on('start',function(point){
            distance.start = point.x;
          });

          finger.on('move',function(point){
            direction = swipePanel.data('direction');

            if(direction == 'left'){
              distance.current = distance.start - point.x;
            }else{
              distance.current = -(distance.start - point.x);
            }

            if(distance.current > waitDistance){
              swipePanelContent.css(direction,'-' + parseInt(distance.current - waitDistance) + 'px');
            }
          });

          finger.on('end',function(point){
            if(distance.current > 50){
              duration = -((distance.current / swipePanelContentWidth) * durationMax - durationMax);
              direction = swipePanel.data('direction');

              if(direction == 'left'){
                if(typeof $(document).velocity !== 'undefined'){
                  swipePanelContent.velocity({
                    left: -swipePanelContentWidth
                  },duration,function(){
                    swipePanelContent.attr('style','');
                    swipePanelContent.attr('class','swipe-panel-content');
                    setTimeout(function(){
                      swipePanel.removeClass('open');
                      swipePanelCloseArea.attr('class','swipe-panel-close-area');
                      if(typeof callbackClose !== 'undefined'){
                        callbackClose(swipePanelContent);
                      }
                    },200);
                  });
                }else{
                  swipePanelContent.animate({
                    left: -swipePanelContentWidth
                  },duration,function(){
                    swipePanelContent.attr('style','');
                    swipePanelContent.attr('class','swipe-panel-content');
                    setTimeout(function(){
                      swipePanel.removeClass('open');
                      swipePanelCloseArea.attr('class','swipe-panel-close-area');
                      if(typeof callbackClose !== 'undefined'){
                        callbackClose(swipePanelContent);
                      }
                    },200);
                  });
                }
              }else{
                if(typeof $(document).velocity !== 'undefined'){
                  swipePanelContent.velocity({
                    right: -swipePanelContentWidth
                  },duration,function(){
                    swipePanelContent.attr('style','');
                    swipePanelContent.attr('class','swipe-panel-content');
                    setTimeout(function(){
                      swipePanel.removeClass('open');
                      swipePanelCloseArea.attr('class','swipe-panel-close-area');
                      if(typeof callbackClose !== 'undefined'){
                        callbackClose(swipePanelContent);
                      }
                    },200);
                  });
                }else{
                  swipePanelContent.animate({
                    right: -swipePanelContentWidth
                  },duration,function(){
                    swipePanelContent.attr('style','');
                    swipePanelContent.attr('class','swipe-panel-content');
                    setTimeout(function(){
                      swipePanel.removeClass('open');
                      swipePanelCloseArea.attr('class','swipe-panel-close-area');
                      if(typeof callbackClose !== 'undefined'){
                        callbackClose(swipePanelContent);
                      }
                    },200);
                  });
                }
              }
            }else{
              direction = swipePanel.data('direction');

              if(direction == 'left'){
                if(typeof $(document).velocity !== 'undefined'){
                  swipePanelContent.velocity({
                    left: 0
                  });
                }else{
                  swipePanelContent.animate({
                    left: 0
                  });
                }
              }else{
                if(typeof $(document).velocity !== 'undefined'){
                  swipePanelContent.velocity({
                    right: 0
                  });
                }else{
                  swipePanelContent.animate({
                    right: 0
                  });
                }
              }
            }
          });
        });
      }

  setTimeout(function(){
    swipePanelContent.addClass(direction);
    setTimeout(function(){
      swipePanelContent.addClass('open');
      callback(swipePanelContent);
    },100);
  },100);
};

$('#mobile-open-menu').on('click',function(){
  var currents = [],
      categories,
      template = {
        container: [
          '<div class="mobile-categories">',
            '<ul>',
              '{{:categories:}}',
            '</ul>',
          '</div>'
        ].join(''),
        list: [
          '<li data-id="{{:id:}}">',
            '<a href="#{{:url:}}" rel="nofollow">{{:name:}}</a>',
            '<i class="fa fa-bars open-subtree"></i>',
          '</li>'
        ].join('')
      },
      getCategoriesElements = $('#header').find('.menu').children(),
      getCategories = function(element){
        return element.children().filter(function(){
          if($(this).hasClass('search') || $(this).hasClass('hamburger')){
            return false;
          }
          return true;
        }).map(function(){
          var list = $(this).children('a'),
              item = {
                id: Math.random().toString(16).slice(2),
                name: list[0].innerText,
                url: typeof list.attr('href') !== 'undefined' ? list.attr('href') : '#'
              };

          /* ---------------------
           * Storage items from vertical menu
           */
          if($(this).hasClass('vertical-menu')){
            if($('#header').find('.header-bottom').find('.vertical-menu-content').children('ul').children('li').length > 0){
              item.children = [];

              $('#header').find('.header-bottom').find('.vertical-menu-content').children('ul').children('li').each(function(){
                var itemLevel1 = {
                  id: Math.random().toString(16).slice(2),
                  name: $(this).children('a')[0].innerText,
                  url: typeof $(this).children('a').attr('href') !== 'undefined' ? $(this).children('a').attr('href') : '#'
                }

                if($(this).children('.sub-categories').length > 0){
                  itemLevel1.children = [];

                  $(this).children('.sub-categories').children().children().children().each(function(){
                    var itemLevel2 = {
                      id: Math.random().toString(16).slice(2),
                      name: $(this).children('.cat-title').children('a')[0].innerText,
                      url: typeof $(this).children('.cat-title').children('a').attr('href') !== 'undefined' ?  $(this).children('.cat-title').children('a').attr('href') : '#'
                    }

                    if($(this).children('ul').length > 0){
                      itemLevel2.children = [];

                      $(this).children('ul').children('li').each(function(){
                        var itemLevel3 = {
                          id: Math.random().toString(16).slice(2),
                          name: $(this).children('a')[0].innerText,
                          url: typeof $(this).children('a').attr('href') !== 'undefined' ? $(this).children('a').attr('href') : '#'
                        }

                        itemLevel2.children.push(itemLevel3);
                      });
                    }

                    itemLevel1.children.push(itemLevel2);
                  });
                }

                item.children.push(itemLevel1);
              });
            }
          /* ---------------------
           * Storage items from horizontal menu
           */
          }else{
            if($(this).children('.dropdown').length > 0){
              item.children = [];

              if($(this).hasClass('single-category')){
                $(this).children('.dropdown').find('ul').eq(0).children().each(function(){
                  var itemLevel1 = {
                    id: Math.random().toString(16).slice(2),
                    name: $(this).children('a')[0].innerText,
                    url: $(this).children('a').attr('href')
                  }

                  item.children.push(itemLevel1);
                });
              }
              if($(this).hasClass('full-width')){
                $(this).children('.dropdown').find('.cat-title').each(function(){
                  var itemLevel1 = {
                    id: Math.random().toString(16).slice(2),
                    name: $(this).children('a')[0].innerText,
                    url: $(this).children('a').attr('href')
                  }

                  if($(this).next().length > 0){
                    itemLevel1.children = [];

                    $(this).next().children().each(function(){
                      var itemLevel2 = {
                        id: Math.random().toString(16).slice(2),
                        name: $(this).children('a')[0].innerText,
                        url: $(this).children('a').attr('href')
                      }

                      itemLevel1.children.push(itemLevel2);
                    });
                  }

                  item.children.push(itemLevel1);
                });
              }
            }
          }

          return item;
        }).get();
      },
      renderMobileCategories = function(list,first){
        var renderList = '',
            renderContainer = template.container,
            cloneList = JSON.parse(JSON.stringify(list));

        if(typeof first !== 'undefined' && first === true){
          cloneList.unshift('back');

          renderContainer = $(renderContainer);
          renderContainer.addClass('fade-in');
          renderContainer = renderContainer.prop('outerHTML');
        }

        cloneList.forEach(function(item){
          var render = template.list;

          if(item == 'back'){
            render = render.replace(/{{:id:}}/g,item.id);
            render = render.replace(/{{:name:}}/g,'Powrót');
            render = render.replace(/#{{:url:}}/g,'#');

            render = $(render);

            render.addClass('close-subtree');
            render.removeAttr('data-id');
            render.find('i').attr('class','fa fa-angle-left')
          }else{
            render = render.replace(/{{:id:}}/g,item.id);
            render = render.replace(/{{:name:}}/g,item.name);
            render = render.replace(/#{{:url:}}/g,item.url);

            render = $(render);

            if(typeof item.children === 'undefined'){
              render.find('i').remove();
            }
          }

          render = render.prop('outerHTML');

          renderList += render;
        });

        return $(renderContainer.replace(/{{:categories:}}/g,renderList));
      };

  categories = getCategories(getCategoriesElements);

  createSwipePanel('left','categories',function(content){
    content.append(renderMobileCategories(categories));

    content.on('click.mobileCategoriesOpen','.open-subtree',function(e){
      e.preventDefault();

      var self = $(this),
          id = self.parents('li').eq(0).data('id'),
          current = categories,
          currentRender;

      currents.push(id);
      currents.forEach(function(single){
        current.forEach(function(item){
          if(item.id == single){
            current = item.children;
          }
        });
      });

      currentRender = renderMobileCategories(current,true)

      content.append(currentRender);
      setTimeout(function(){
        currentRender.removeClass('fade-in');
      },100);
    });

    content.on('click.mobileCategoriesClose','.close-subtree',function(e){
      e.preventDefault();

      var self = $(this),
          subTree = content.find('.mobile-categories').last();

      currents.pop();

      subTree.addClass('fade-in');

      setTimeout(function(){
        subTree.remove();
      },100);
    });
  },function(content){
    content.off('click.mobileCategoriesOpen click.mobileCategoriesClose');
  });
});

$('#header .top-bar .quick-cart > .link').on('click',function(){
  var windowWidth = window.innerWidth;
  var pathName = window.location.pathname;
  var cartPathName = "/cart/";
  
  // avoid opening cart widget while conditions for : cart page and mobile view are true
  if(pathName === cartPathName && windowWidth <= 1024){
    return false;
  }
  createSwipePanel('right','quick-cart',function(content){
    var cart = $('#header .top-bar .quick-cart > .dropdown.dropdown-quick-cart').clone();
    content.append(cart);
  });
});

$('#mobile-open-search').on('click',function(){
  var self = $(this),
      body = $('body > main'),
      mobileSearch = body.find('section.mobile-search').find('input[type="text"]');

  if(body.hasClass('mobile-search-show')){
    self.removeClass('active');
    body.removeClass('mobile-search-show');
    mobileSearch.trigger('blur');
  }else{
    self.addClass('active');
    body.addClass('mobile-search-show');
    mobileSearch.trigger('focus');
  }
});

$('#mobile-open-contact').on('click',function(){
  var self = $(this),
      patterns = {
        sections: {
          contact: [
            '<span class="section">' + L['CONTACT'] + '</span>',
            '<div class="icons">{{:icons:}}</div>'
          ],
          socials: [
            '<span class="section">' + L['YOU_ARE_US_ON'] + '</span>',
            '<div class="icons">{{:icons:}}</div>'
          ]
        },
        elements: {
          contact: [
            '<a href="{{:url:}}" {{:target:}}>',
              '<i class="fa fa-{{:icon:}}"></i> <span class="value">{{:value:}}</span>',
            '</a>',
            '<br />'
          ],
          social: [
            '<a href="{{:url:}}" {{:target:}}>',
              '<i class="fa fa-{{:icon:}}"></i>',
            '</a>'
          ]
        }
      },
      elements = {
        contact: [],
        socials: []
      };

  $(self.prevAll('[data-type]').get().reverse()).each(function(){
    var self = $(this),
        type = self.data('type'),
        url = self.find('a').attr('href'),
        icon = self.find('i').attr('class').split('fa-')[1].split(' ')[0],
        pattern;

    if(typeof type.split('social-sm_')[1] === 'undefined'){
      pattern = patterns.elements.contact.join('');
      pattern = pattern.replace(/{{:url:}}/g,url);
      pattern = pattern.replace(/{{:icon:}}/g,icon);
      pattern = pattern.replace(/{{:value:}}/g,url.split(':')[1]);
      pattern = pattern.replace(/{{:target:}}/g,'');

      elements.contact.push(pattern);
    }else{
      pattern = patterns.elements.social.join('');
      pattern = pattern.replace(/{{:url:}}/g,url);
      pattern = pattern.replace(/{{:icon:}}/g,icon);
      pattern = pattern.replace(/{{:target:}}/g,'target="_blank"');

      elements.socials.push(pattern);
    }
  });

  patterns.sections.contact = patterns.sections.contact.join('');
  patterns.sections.socials = patterns.sections.socials.join('');

  patterns.sections.contact = patterns.sections.contact.replace(/{{:icons:}}/g,elements.contact.join(''));
  patterns.sections.socials = patterns.sections.socials.replace(/{{:icons:}}/g,elements.socials.join(''));

  createSwipePanel('left','mobile-contact',function(content){
    content.append($([
      patterns.sections.contact,
      patterns.sections.socials
    ].join('')));
  });
});

$('section.mobile-search').find('.close-shape').on('click',function(){
  var button = $('#mobile-open-search');
      body = $('body > main');

  button.removeClass('active');
  body.removeClass('mobile-search-show');
});

$(window).on('load.slidersResize resize.slidersResize',function(){
  var sliders = $('section.slider');

  if(sliders.length > 0){
    slidersResize(sliders);
  }else{
    $(this).off('load.slidersResize resize.slidersResize');
  }
});

$(document).on('ready',function(){
  var sliders = $('section.slider');

  if(sliders.length > 0){
    slidersResize(sliders);
  }

  if(window.location.href.indexOf('opt_required=1') > -1){
    var productCard = $('.product-card'),
        addToCart = productCard.find('.core_addToCart').eq(0);

    addToCart.trigger('click');

    popups.actionAlert(L['INFORMATION'],L['OPT_REQIRED_INFO'],'info');
  }

  $('.scrollbar-inner').scrollbar();
  $('.scrollbar-inner')
    .on('mouseenter',function(){
      $(this).on('mousewheel DOMMouseScroll',function(e){
        var originalEvent = e.originalEvent,
            delta = originalEvent.wheelDelta || -originalEvent.detail;

        this.scrollTop += (delta < 0 ? 1 : -1) * 50;
        e.preventDefault();
      });
    })
    .on('mouseleave',function(){
      $(this).off('mousewheel DOMMouseScroll');
    });
});

$('.datetime-field[data-type="date"]').datetimepicker({
  language: S['LANG'],
  orientation: 'right',
  pickTime: false,
  pickSeconds: false,
  weekStart: 1,
  startDate: new Date(),
  endDate: new Date(
    new Date().getFullYear() + 1,
    new Date().getMonth(),
    new Date().getDate()
  )
});
$('.datetime-field[data-type="datetime"]').datetimepicker({
  language: S['LANG'],
  orientation: 'right',
  pickTime: true,
  pickSeconds: false,
  weekStart: 1,
  startDate: new Date(),
  endDate: new Date(
    new Date().getFullYear() + 1,
    new Date().getMonth(),
    new Date().getDate()
  )
});
$('.datetime-field').on('click','.add-on-input',function(){
  $(this).parent().find('.add-on').trigger('click');
});

$('.rate-field.choice').find('.stars').find('.fa-star-o')
  .on('mouseenter',function(){
    var self = $(this),
        parent = self.parents('.rate-field'),
        placeholder = parent.find('.stars-placeholder'),
        value = ((self.data('value') * 10 / parent.find('.fa-star-o').length) * 10) + '%';

    placeholder.css('width',value);
  })
  .on('click',function(){
    var self = $(this),
        parent = self.parents('.rate-field'),
        input = parent.find('.rate-value'),
        placeholder = parent.find('.stars-placeholder'),
        value = ((self.data('value') * 10 / parent.find('.fa-star-o').length) * 10) + '%';

    placeholder.css('width',value);
    input.val(self.data('value'));
  });

$('.rate-field.choice').find('.stars')
  .on('mouseleave',function(e){
      var self = $(this),
          parent = self.parents('.rate-field'),
          input = parent.find('.rate-value'),
          placeholder = parent.find('.stars-placeholder');

      if(input.val() == ''){
        placeholder.css('width','0%');
      }else{
        var value = ((parseInt(input.val()) * 10 / parent.find('.fa-star-o').length) * 10) + '%';
        placeholder.css('width',value);
      }
  });

$('.heading ul.nav li').on('click',function(){
  if(!$(this).hasClass('active')){
    var self = $(this),
        active = self.parent().find('li.active'),
        index = $(this).attr('data-rel-tab') ? $(this).attr('data-rel-tab') : parseInt(self.index() + 1),
        group = $(self.parents()[2]),
        current = group.find('.tab').not('.tab-hidden'),
        currentHeight = current.outerHeight(true),
        tab = group.find('[data-tab="' + index + '"]'),
        tabHeight = tab.outerHeight(true),
        wasSlider = current.hasClass('carousel'),
        isSlider = tab.hasClass('carousel'),
        isSliderName;

    active.removeClass('active');
    self.addClass('active');
    tab.height(currentHeight);

    current.animate({
      opacity: 0
    },0,function(){
      current.addClass('tab-hidden');
      tab.css('opacity',0);

      if(wasSlider){
        current.trigger('destroy.owl.carousel').removeClass('owl-carousel owl-loaded');
        current.find('.owl-stage-outer').children().unwrap();
      }

      tab.removeClass('tab-hidden');

      if(isSlider){
        isSliderName = tab.data('carousel-name');

        carousels[isSliderName]();
      }

      setTimeout(function(){
        if(typeof $(document).velocity !== 'undefined'){
          tab.velocity({
            opacity: 1
          },50,function(){
            tab.attr('style',function(i,style){
              return style.replace(/height[^;]+;?/g,'');
            });
          });
        }else{
          tab.animate({
            opacity: 1
          },50,function(){
            tab.attr('style',function(i,style){
              return style.replace(/height[^;]+;?/g,'');
            });
          });
        }
      },0);
    });
  }
});

$('.categories.slides').find('a').on('click',function(e){
  e.preventDefault();

  var self = $(this),
      childs = $(this).next();

  if(childs.hasClass('active')){
    self.removeClass('revert');
    childs.removeClass('active');
    childs.slideUp(200);
  }else{
    self.addClass('revert');
    childs.addClass('active');
    childs.slideDown(200);
  }
});

$('.categories.dropdowns > ul > li').children('a.rolldown').on('click',function(e){
  e.preventDefault();

  var self = $(this),
      childs = $(this).next();

  if(childs.hasClass('active')){
    self.removeClass('revert');
    childs.removeClass('active');
    childs.slideUp(200);
  }else{
    self.addClass('revert');
    childs.addClass('active');
    childs.slideDown(200);
  }
});

function isResponsiveImageChecker(){
  var blogContainer = $('.post-content').innerWidth();
      blogImage = $('.post-content').find('img');

  for( var i = 0;  i < blogImage.length ; i++){
      blogImageWidth = blogImage[i].offsetWidth;

    if(blogImageWidth > blogContainer){
      $(blogImage[i]).addClass('responsive-image');
    }
  }
}
isResponsiveImageChecker();

initializeSelect2();


// protecting shop forms from spam bots
function addSpamProtectionToForms(){
  // array of forms you want to protect
  // note that you have to specify correct selector by using "." for class name or "#" for id
  var formHandlersArray = [
    '.newsletter-form',
    '.popupContent form',
    '.newsletter form',
    '.contentSidebar form',
    '.product-opinions form',
    '.core_addTicket',
    '.core_sendPhone',
    '.core_addOpinion',
    '.core_askQuestion',
    '.core_addEmailToNewsletter',
    '.order form'
  ];
  var isJs = 'is_js-true';
  var protectingInput = '<input type="hidden" value="1" class="pro-tecting-_-Input" name="'+isJs.split('-')[0]+'"/>';

  // check every selector from the array
  for(formHandler of formHandlersArray){
    var form = $(document).find($(formHandler));
    // if element exists in document and doesn't contain protecting input:
    if(form[0] && !form.find('.pro-tecting-_-Input').length){
      form.append(protectingInput);
    }
  }
}
addSpamProtectionToForms();

function jsHash(hash) {
  this.key = 'js_hash';
  this.oldValue = cookies.read(this.key);

  if( hash && (!this.oldValue || this.oldValue !== hash) ) {
    cookies.create(this.key, hash, 60*60*24*1000);
  }
}
jsHash($('body').data('js-hash'));