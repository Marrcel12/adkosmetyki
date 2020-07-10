/* ================================================================================================================
 * SET GLOBAL VARIABLES
 */

window.SkyShop = {
  cart: {
    products: {},
    ajaxHash: []
  },
  order: {
    paymentId: null,
    shipments: {},
    shipmentsParsed: {},
    shipmentPrice: null,
    shipmentSelected: null,
    overheadValue: '0.00'
  },
  card: {
    stocks: {
      pattern: {
        stocks: null,
        stocksSelected: {},
        stocksSelectedLast: {},
        stocksSelectedLastGroup: null
      },
      storable: {},
      allowStockRequest: false,
    },
    counterError: null
  },
  core: {
    quickSearchAjax: null
  },
  debug: function (callback) {
    callback = callback || function () {};
    if ($('body').attr('data-debug') == "true") {
      callback();
      return true;
    } else {
      return false;
    }
  }
};
/* ================================================================================================================
 * MESSAGE LIST SHOW
 */

$(document).find('.core_messageListShow').each(function(){
  var self = $(this);

  var data = {
    messages: typeof self.data('messages-list') !== 'undefined' ? self.data('messages-list').split('>:<') : [],
    errors: typeof self.data('errors-list') !== 'undefined' ? self.data('errors-list').split('>:<') : [],
    contents: [],
    showPopupsRecurency: function(messages){
      if(messages.length == 0){
        return;
      }

      var message = messages[0].split('|'),
          message = {
            title: message[0].slice(1,-1),
            content: message[1].slice(1,-1),
            type: message[2].slice(1,-1)
          };

      messages.shift();

      if(messages){
        popups.actionAlert(message.title,message.content,message.type,function(){
          data.showPopupsRecurency(messages);
        });
      }
    }
  };

  data.contents = data.messages.concat(data.errors);

  data.showPopupsRecurency(data.contents);
});


/* ================================================================================================================
 * COMMON ALERT SHOP CLOSE
 */

$(document).on('click','.core_commonAlertShopClose',function(e){
  e.preventDefault();

  window.location = '/login/';
});


/* ================================================================================================================
 * COMMON ALERT SHOP CLOSE
 */

$(document).on('click','.core_commonAlertConditionalAccess',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    type: self.data('type'),
    alert: self.parents('.skyshop-alert-shop-close').eq(0),
    isSweetAlert: $('.swal2-container').hasClass('fade in')
  };

  switch(data.type){
    case 'yes':
      data.alert.transition('fadeOut',200,function(){
        data.alert.remove();
        cookies.create('ca_yes',1,31536000000);

        if(!data.isSweetAlert){
          $('html,body').removeClass('prevent-scroll');
          $('html,body').removeClass('prevent-scroll-desktop');
        }
      });
      break;
    case 'no':
      window.history.back();
      break;
  }
});


/* ================================================================================================================
 * PARSE FORM
 */

$(document).on('submit','.core_parseForm',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    validate: formValidator(self),
    storage: formStorage(self),
    isEncoding: typeof self.data('encode') !== 'undefiend' && self.data('encode') == true ? true : false
  };

  if(data.validate){
    if(data.isEncoding){
      self.after($([
        '<form class="hidden" method="' + self.attr('method') + '" action="' + self.attr('action') + '">',
        self.serializeArray().map(function(option){
          return '<input name="' + option.name + '" value="' + encodeURIComponent(option.value) + '" />';
        }).join(''),
        self.find('[type="submit"]').eq(0)[0].outerHTML,
        '</form>'
      ].join('')));

      setTimeout(function(){
        self.next().find('[type="submit"]').eq(0).trigger('click');
      },200);
    }else{
      self.removeClass('core_parseForm');

      setTimeout(function(){
        self.find('[type="submit"]').eq(0).trigger('click');
      },200);
    }
  }
});


/* ================================================================================================================
 * SUBMIT CART
 */

$(document).on('submit','.core_submitCart',function(e){
  e.preventDefault();

  var self = $(this),
      cart = self.parents('.cart');

  removeAllErrors(cart.find('.core_storeCartProducts'));

  var errors = {};


  if(cart.length > 0){
    cart.find('.core_parseOption').each(function(){
      var option = $(this);

      if(typeof option.data('required') !== 'undefined' && option.data('required') === true){
        if(option.hasClass('select-field-select2')){
          if(option.val() == ''){
            errors[option.data('key')] = 'required';
          }
        }
      }
    });
  }

  if(Object.keys(errors).length > 0){
    $.each(errors,function(optionId,type){
      var errorContainer = $('.core_parseOption[data-key="' + optionId + '"]'),
          errorContainerElement = errorContainer;

      if(errorContainer.hasClass('select-field-select2')){
        errorContainerElement = errorContainer.next();
      }

      if(type == 'required'){
        addError(errorContainerElement,errorContainer.data('required-error'));
      }
    });

    popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['OPT_REQIRED_INFO'],'error');

    return false;
  }else{
    self.removeClass('core_submitCart');

    setTimeout(function(){
      self.find('[type="submit"]').eq(0).trigger('click');
    },200);
  }
});


/* ================================================================================================================
 * STORE CART PRODUCTS
 */

$(document).find('.core_storeCartProducts').each(function(){
  var self = $(this);

  var data = {
    serialize: self.find('tbody').find('tr[data-hash]'),
    isCart: self.parents('section.cart').length > 0 ? true : false,
    isOrder: self.parents('section.order').length > 0 ? true : false
  };

  data.serialize.each(function(){
    var product = $(this),
        options = {};

    /* Store data form cart */
    if(data.isCart){
      if(Object.keys(SkyShop.cart.products).length == 0){
        SkyShop.cart.products = self.data('products');
      }else{
        product.find('.core_parseOption').each(function(){
          var option = $(this);

          if(typeof option.data('required') !== 'undefined' && option.data('required') === true){
            options[option.data('key')] = option.val();
          }else if((option.data('required') === 'undefined' || option.data('required') === false) && option.val() != ''){
            options[option.data('key')] = option.val();
          }else if(option.find('input:checked').length > 0){
            options[option.data('key')] = option.val();
          }
        });

        SkyShop.cart.products[product.data('hash')] = {
          id: product.data('id'),
          amount: product.find('input[name*="amount_"]').val(),
          options: options
        }
      }
    }

    /* Store data from order */
    if(data.isOrder){
      if(typeof product.data('options') !== 'undefined'){
        var option = product.data('options').split(',');
        option.forEach(function(value){
          if(value != ''){
            value = value.split(':');
            options[value[0]] = value[1];
          }
        });
      }

      SkyShop.cart.products[product.data('hash')] = {
        id: product.data('id'),
        amount: product.data('amount'),
        options: options
      }

      orderCalculate();
    }
  });
});


/* ================================================================================================================
 * STORE CART PRODUCT AMOUNT
 */

$(document).on('click','.core_changeProductPhoto',function(){
  var self = $(this),
      productCard = $('.product-card'),
      image;

  var data = {
    label: self.data('image-label')
  };

  if(productCard.length > 0){
    image = productCard.find('.product-slideshow').find('[data-label="' + data.label + '"]');

    if(image.length > 0){
      image.trigger('click');
    }
  }
});


/* ================================================================================================================
 * STORE CART PRODUCT AMOUNT
 */

$(document).on('change','.core_storeCartProductAmount',function(){
  var self = $(this);

  var data = {
    amount: self.val(),
    hash: self.parents('[data-hash]').data('hash')
  };

  if(data.amount < self.data('min')){
    data.amount = self.data('min');
  }

  if(data.amount != ''){
    SkyShop.cart.products[data.hash].amount = parseFloat(data.amount);

    cartUpdate({
      wait: 300,
      hash: [data.hash]
    });
  }
});


/* ================================================================================================================
 * CHANGE SORT TYPE
 */

$(document).on('change','.core_changeSortType',function(){
  if(document.readyState == 'complete'){
    var self = $(this);

    var data = {
      url: self.find('option:checked').val()
    };

    window.location = data.url;
  }
});


/* ================================================================================================================
 * CHOOSE PARAMETERS MULTI
 */

$(document).on('select2:closing','.core_chooseParametersMulti',function(){
  var self = $(this);

  var data = {
    optionPattern: self.prev().find('.choosed-option-pattern')[0].outerHTML
  };

  self.prev().children('input:not(.choosed-option-pattern)').remove();
  self.find('option:checked').each(function(){
    var option = $(this),
        pattern = data.optionPattern;
    pattern = pattern.replace(/{{:name:}}/g,option.attr('name'));

    pattern = $(pattern);
    pattern.removeAttr('disabled');

    self.prev().append(pattern);
  });
});


/* ================================================================================================================
 * CHOOSE SEARCH PRICE
 */

$(document).on('select2:closing','.core_chooseSearchPrice',function(){
  var self = $(this),
      dropdown = $('.select2-results').find('.select2-results__options');

  var data = {
    results: [
      { name: 'from', value: (dropdown.find('input[name="from"]').val() == '' && dropdown.find('input[name="to"]').val() == '' ? 0 : dropdown.find('input[name="from"]').val()) },
      { name: 'to', value: (dropdown.find('input[name="to"]').val() == '' && dropdown.find('input[name="from"]').val() == '' ? 524288 : dropdown.find('input[name="to"]').val()) }
    ],
    optionPattern: self.prev().find('.choosed-option-pattern')[0].outerHTML
  }

  self.prev().children('input:not(.choosed-option-pattern)').remove();
  data.results.forEach(function(option){
    var pattern = data.optionPattern;
    pattern = pattern.replace(/{{:name:}}/g,option.name);
    pattern = pattern.replace(/{{:value:}}/g,option.value);

    pattern = $(pattern);
    pattern.removeAttr('disabled');

    self.prev().append(pattern);
  });
});


/* ================================================================================================================
 * GET ORDER SHIPMENTS
 */

$(document).on('click change','.core_getOrderShipments',function(e){
  e.preventDefault();

  var self = $(this),
      order = $('.order');

  if(e.type == 'click'){
    SkyShop.order.paymentId = order.find('input[name="payment"]:checked').val();
    SkyShop.order.overheadValue = self.find('.pay-overhead').val();

    if(self.next().hasClass('more')){
      self.next().find('input[name="payment"]').prop('checked',true);

      if(self.next().find('input[name="payment"]').val() != ''){
        SkyShop.order.paymentId = self.next().find('input[name="payment"]').val();
      }else{
        SkyShop.order.paymentId = self.next().find('[data-payment-banks]').data('payment-banks');
      }
    }

    cookies.create('ac_payment',SkyShop.order.paymentId,60 * 24 * 60 * 60 * 1000);
  }

  var data = {
    paymentId: SkyShop.order.paymentId,
    country: order.find('select[name="user_country"]').val(),
    shipment: order.data('shipment'),
    coupon: order.find('.core_orderPriceCoupon').data('price'),
    products: $.base64Encode(JSON.stringify(SkyShop.cart.products)),
    isValidate: !self.parents('.order-select-table').hasClass('ss-error')
  };

  if(typeof data.paymentId === 'undefined'){
    return;
  }

  if(!data.isValidate){
    removeError(self.parents('.order-select-table'));
  }

  var url = '/order/?json=1&pay_id=' + encodeURIComponent(data.paymentId) + '&c=' + data.country + '&sel=' + data.shipment + (data.coupon !== undefined ? '&code_discount=' + data.coupon : '');

  orderCalculate();

  $.ajax({
    type: 'POST',
    url: url,
    data: {
      products: data.products
    },
    dataType: 'json',
    success: function(response){
      SkyShop.order.shipments = response;
      orderRenderDeliveries(response);
    }
  });
});

$(window).on('load',function(){
  $(document).find('.core_getOrderShipments').each(function(){
    var self = $(this);

    var data = {
      paymentId: self.data('payment-id')
    };

    if(cookies.read('ac_payment') != null && cookies.read('ac_payment').split('_')[0] == data.paymentId){
      SkyShop.order.paymentId = cookies.read('ac_payment');

      self.trigger('click');
      self.children('td').eq(0).trigger('click');
    }
  });
});


/* ================================================================================================================
 * GET ORDER SHIPMENTS SPECIAL
 */

$(document).on('keyup paste','.core_quickSearchAjax',function(e){
  if([13,16,17,18,27,32,37,39,38,40].indexOf(e.which) > -1){
    return false;
  }

  var self = $(this),
      results = $('.core_quickSearchAjaxHints');

  var data = {
    search: self.val(),
    searchLoading: results.find('.search-loading'),
    searchInformation: results.find('.search-information'),
    searchCount: results.find('.search-count'),
    resultPattern: results.find('.search-result-pattern')[0].outerHTML
  };
  var url = '/search?action=quick_search&json=1';

  if(data.search.length > 2){
    if(typeof SkyShop.core.quickSearchAjax === 'number'){
      clearTimeout(SkyShop.core.quickSearchAjax);
    }

    if(results.hasClass('hidden')){
      results.removeClass('hidden');
    }

    data.searchLoading.removeClass('hidden');
    data.searchInformation.addClass('hidden');
    data.searchCount.addClass('hidden');

    SkyShop.core.quickSearchAjax = setTimeout(function(){
      $.post(url,{
        cat_search: data.search
      },function(response){
        response = JSON.parse(response);

        results.find('tr').not('.search-result-pattern').remove();

        if(response.success == true){
          var searchResults = Object.keys(response.data.list);

          if(searchResults.length > 0){
            searchResults.forEach(function(id){
              var result = response.data.list[id];

              var resultTemplate = data.resultPattern;
              resultTemplate = resultTemplate.replace(/{{:id:}}/g,result.prod_id);
              resultTemplate = resultTemplate.replace(/#{{:url:}}/g,result.prod_url);
              resultTemplate = resultTemplate.replace(/{{:image:}}/g,result.prod_img_src);
              resultTemplate = resultTemplate.replace('src="/view/new/img/transparent.png"', '');
              resultTemplate = resultTemplate.replace(/{{:name:}}/g,result.prod_name);
              resultTemplate = resultTemplate.replace(/{{:is_discount:}}/g,result.prod_oldprice == 0 ? 'hidden' : '');
              resultTemplate = resultTemplate.replace(/{{:price:}}/g,result.prod_oldprice == 0 ? result.prod_price : result.prod_oldprice);
              resultTemplate = resultTemplate.replace(/{{:price_discount:}}/g,result.prod_price);
              resultTemplate = resultTemplate.replace(/data-src/g,'src');

              resultTemplate = $(resultTemplate);
              resultTemplate.removeClass('search-result-pattern hidden');

              results.each(function(){
                var resultTemplateClone = resultTemplate.clone();

                $(this).find('tr').eq(-1).after(resultTemplateClone);
              });
            });

            pricesFormatter(results.find('tr').not('.search-result-pattern'));

            data.searchLoading.addClass('hidden');
            data.searchInformation.addClass('hidden');
            data.searchCount.removeClass('hidden');

            data.searchCount.find('.count').text(response.data.count);
          }else{
            results.find('tr').not('.search-result-pattern').remove();
            data.searchLoading.addClass('hidden');
            data.searchInformation.removeClass('hidden');
            data.searchCount.addClass('hidden');

            data.searchInformation.find('.information').html(L['NO_PRODUCTS_IN_CATEGORY'].replace(/&#34;/g,'"'));
          }
        }else{
          results.find('tr').not('.search-result-pattern').remove();
          data.searchLoading.addClass('hidden');
          data.searchInformation.removeClass('hidden');
          data.searchCount.addClass('hidden');

          data.searchInformation.find('.information').text(L['ERROR_UNEXPECTED_ERROR']);
        }
      });
    },300);
  }else{
    if(typeof SkyShop.core.quickSearchAjax === 'number'){
      clearTimeout(SkyShop.core.quickSearchAjax);
    }

    if(!results.hasClass('hidden')){
      results.addClass('hidden');
    }

    results.find('tr').not('.search-result-pattern').remove();
    data.searchLoading.addClass('hidden');
    data.searchInformation.addClass('hidden');
    data.searchCount.addClass('hidden');
  }
});

$(document).on('blur','.core_quickSearchAjax[data-ajax-blur="true"]',function(e){
  var self = $(this),
      results = $('.core_quickSearchAjaxHints');

  setTimeout(function(){
    if(!results.hasClass('hidden')){
      results.addClass('hidden');
    }
  },100);
});

$(document).on('focus','.core_quickSearchAjax[data-ajax-blur="true"]',function(e){
  var self = $(this),
      results = $('.core_quickSearchAjaxHints');

  var data = {
    search: self.val()
  };

  if(results.hasClass('hidden') && data.search.length > 2){
    results.removeClass('hidden');
  }
});


/* ================================================================================================================
 * GET ORDER SHIPMENTS SPECIAL
 */

$(document).on('click','.core_getOrderShipmentsSpecial',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    more: self.next(),
    key: self.data('key'),
    isSelected: false
  };

  if(data.more.hasClass('more')){
    data.more.children('td').html(orderShipments(data.key));

    data.isSelected = cookies.read('ac_methods') != null && data.more.children('td').find('select').find('option[value="' + cookies.read('ac_methods') + '"]').eq(0).length > 0;

    if(data.isSelected){
      data.more.children('td').find('select').val(cookies.read('ac_methods'));
    }

    data.more.children('td').find('select').select2({
      theme: 'bootstrap',
      width: '100%',
      language: {
        noResults: function(){
          return L['FIRST_SELECT_CITY'];
        }
      },
      escapeMarkup: function(markup){
        return markup;
      }
    }).on('select2:open',function(){
      $('.select2-results > ul').scrollbar();
    }).on('select2:closing',function(){
      $('.select2-results > ul').scrollbar('destroy');
    });

    if(data.isSelected){
      data.more.children('td').find('select').trigger('select2:select');
    }
  }
});

/* ================================================================================================================
 * SET ORDER SHIPMENTS
 */

$(document).on('click','.core_setOrderShipment',function(e,additionalData){
  e.preventDefault();

  var self = $(this),
      order = $('.order');

  var data = {
    shipmentPrice: parseFloat(self.find('.cost').children('span').data('price')),
    shipmentSelected: self.find('input[name="shipment"]').val(),
    shipmentType: self.data('shipment-type'),
    shipmentTypeManipulateElements: order.find('.core_personalOrderShipment'),
    shipmentRequired: self.find('input[name="shipment"]').data('valid-parent'),
    updateCookie: typeof additionalData !== 'undefined' && typeof additionalData.updateCookie !== 'undefined' ? additionalData.updateCookie : true
  };

  SkyShop.bug.pickDelivery(this);

  if(self.parents('.ss-error').eq(0).length > 0){
    removeError(self.parents('.ss-error').eq(0));
  }

  recalculateErrors();

  if(data.shipmentType == 'personal' && data.shipmentRequired == ''){
    data.shipmentTypeManipulateElements.addClass('hidden');
  }else{
    data.shipmentTypeManipulateElements.removeClass('hidden');
  }

  SkyShop.order.shipmentPrice = data.shipmentPrice;
  SkyShop.order.shipmentSelected = data.shipmentSelected;

  if(data.updateCookie){
    cookies.create('ac_shipment',data.shipmentSelected,60 * 24 * 60 * 60 * 1000);
  }

  orderCalculate();
});


/* ================================================================================================================
 * OPEN ORDER BANK SELECT
 */

$(document).on('click','.core_openOrderBankSelect',function(e){
  e.preventDefault();

  var self = $(this);

  var banksList = null,
      banksCustomClass = [],
      banksListNew = {},
      banksPayment = self.find('[data-payment-banks]'),
      banksPaymentId = banksPayment.data('payment-banks');

  switch(banksPaymentId){
    case 3: // PayU
    case 13: // PayU.cz
      PlnPayTypeArray.forEach(function(channel){
        banksListNew[channel['type']] = {
          img: channel['img'],
          name: channel['name']
        }
      });

      banksList = banksListNew;
      break;
    case 9: // Tpay
      tr_channels.forEach(function(channel){
        banksListNew[channel[0]] = {
          img: channel[3],
          name: channel[1]
        }
      });

      banksList = banksListNew;
      break;
    case 10: // Dotpay
      banksList = JSON.parse(Payment[10]).available_channels;

      Object.keys(banksList).forEach(function(channel){
        banksListNew[channel] = {
          img: banksList[channel].logo_file,
          name: banksList[channel].name
        }
      });

      banksList = banksListNew;
      break;
    case 11: // Przelewy24
      banksList = JSON.parse(Payment[11]).available_channels;
      break;
    case 15: // SkyPay
      banksList = JSON.parse(Payment[15]).available_channels;

      Object.keys(banksList).forEach(function(channel){
        banksListNew[channel] = {
          img: banksList[channel].logo_file,
          name: banksList[channel].name
        }
      });

      banksList = banksListNew;

      banksCustomClass = ['banks-skypay'];
      break;
  }

  var data = {
    banksList: banksList,
    banksClass: ['common-banks-list','container-fluid'].concat(banksCustomClass).join(' '),
    bankPattern: self.next()[0].outerHTML,
    banksListHtml: '',
    bankLogos: {
      loaded: 0,
      total: Object.keys(banksList).length
    }
  };

  var showBanksPopup = function(){
    Object.keys(data.banksList).forEach(function(key){
      var bank = data.banksList[key],
          bankElement = data.bankPattern,
          banksListPopup = $(document).find('.swal2-container').find('.row');

      bankElement = bankElement.replace(/{{:id:}}/g,key);
      bankElement = bankElement.replace(/{{:name:}}/g,bank['name']);
      bankElement = bankElement.replace(/{{:logo:}}/g,bank['img']);
      bankElement = bankElement.replace(/data-src/g,'src');
      bankElement = bankElement.replace(/bank-pattern/g,'');
      bankElement = bankElement.replace(/hidden/g,'');

      data.banksListHtml += bankElement;

      banksListPopup.html(data.banksListHtml);
    });
  };

  swal({
    width: 1000,
    confirmButtonText: '',
    confirmButtonClass: 'btn btn-hidden',
    title: L['SELECT_BANK'],
    html: '<div class="' + data.banksClass + '"><div class="row"><i class="fa fa-refresh fa-spin fa-3x fa-fw"></i></div></div>'
  });

  Object.keys(data.banksList).forEach(function(key){
    var bank = data.banksList[key],
        bankLogo = new Image();

    bankLogo.onload = function(){
      data.bankLogos.loaded++;

      if(data.bankLogos.loaded == data.bankLogos.total){
        showBanksPopup();
      }
    };
    bankLogo.onerror = function(e){
      data.bankLogos.loaded++;

      data.banksList[key]['img'] = '/view/new/img/ico/bank.png';

      if(data.bankLogos.loaded == data.bankLogos.total){
        showBanksPopup();
      }
    };
    bankLogo.src = bank['img'];
  });
});


/* ================================================================================================================
 * ORDER SHIPMENT SELECT
 */

$(document).on('select2:select','.core_orderShipmentSelect',function(e,additionalData){
  e.preventDefault();

  var self = $(this);

  var data = {
    key: self.data('key'),
    type: self.data('type'),
    city: self.val(),
    streetsRendered: typeof additionalData !== 'undefined' && typeof additionalData.streetsRendered !== 'undefined' ? true : false
  };

  cookies.create('ac_methods',data.city,60 * 24 * 60 * 60 * 1000);
  orderShipmentsStreets(data.key,data.type,data.city,function(){
    if(data.streetsRendered){
      additionalData.streetsRendered();
    }
  });
});


/* ================================================================================================================
 * ORDER SHIPMENT SELECT STREET
 */

$(document).on('select2:select','.core_orderShipmentSelectStreet',function(e){
  e.preventDefault();

  var self = $(this),
      more = self.parents('tr.more').eq(0);

  var data = {
    key: self.data('streets'),
    value: self.val()
  };

  more.find('input[name*="shipment_method"]').val(data.value);

  cookies.create('ac_ship' + data.key + '_method',data.value,60 * 24 * 60 * 60 * 1000);
});


/* ================================================================================================================
 * PARMS TO DEBUG
 */

SkyShop.bug = {
  parse: {
    street: {},
    shipment: {},
    SelectStreet: {error: 'null'},
    SelectShipment: {error: 'null'},
    delivery: {error: 'null'},
    counter: 0
  },
  add: function () {
    var handler = '#order-deliverys-methods .more.open .hidden';

    if ( $(handler + ' .order_bug').length == 0 ) {
      $(handler).append('<input type="hidden" class="order_bug" name="order_bugs" value=\''+JSON.stringify(SkyShop.bug.parse)+'\'>');
    } else {
      $(handler + ' .order_bug').val(JSON.stringify(SkyShop.bug.parse));
    }
    //cookies.create('bug_test_orders',JSON.stringify(SkyShop.bug.parse), 60 * 24 * 60 * 60 * 1000)
  },
  pickDelivery: function (item) {
    var h = $(item);
    var selects = {}
    var more = $('#order-deliverys-methods .more.open');

    if (h.hasClass('core_getOrderShipmentsSpecial') && more.length > 0) {

      if ( more.find('.core_orderShipmentSelect').length > 0 ) {
        selects.realShipment = more.find('.core_orderShipmentSelect').val();
      } else {
        selects.realShipment = false;
      }

      if ( more.find('.core_orderShipmentSelectStreet').length > 0 ) {
        selects.realStreet = more.find('.core_orderShipmentSelectStreet').val();
      } else {
        selects.realStreet = false;
      }

      if ( more.find('.core_orderShipmentSelectStreet + span .select2-selection__rendered').length > 0 ) {
        selects.fakeStreet = more.find('.core_orderShipmentSelectStreet + span .select2-selection__rendered').text();
      } else {
        selects.fakeStreet = false;
      }

      if ( more.find('.core_orderShipmentSelect + span .select2-selection__rendered').length > 0 ) {
        selects.fakeShipment = more.find('.core_orderShipmentSelect + span .select2-selection__rendered').text();
      } else {
        selects.fakeShipment = false;
      }

    } else {
      SkyShop.bug.parse.delivery.error = 'no special options';
    }

    SkyShop.bug.parse.delivery = {
      key: h.attr('data-key'),
      title: h.find('.method-title').text(),
      cost: h.find('.core_priceFormat').attr('data-price'),
      select: selects,
      counter: ++SkyShop.bug.parse.counter
    }
    SkyShop.bug.add();
  }
}


$(document).on('select2:select', function (e) {
  var h = $(e.target);
  var tmp;
  var street = '#order-deliverys-methods .core_orderShipmentSelectStreet';
  var fake = ' + span .select2-selection__rendered';

  if ( h.hasClass('core_orderShipmentSelectStreet') ) {
    if (e.params && e.params.data) {
      tmp = e.params.data;
      SkyShop.bug.parse.street = {
        id: tmp.id,
        text: tmp.text,
        selected: tmp.selected,
        error: '',
        counter: ++SkyShop.bug.parse.counter
      }
    } else {
      SkyShop.bug.parse.street.error = 'not changed';
    }
  } else if ( h.hasClass('core_orderShipmentSelect') ) {
    if (e.params && e.params.data) {
      tmp = e.params.data;
      SkyShop.bug.parse.shipment = {
        id: tmp.id,
        text: tmp.text,
        selected: tmp.selected,
        error: '',
        counter: ++SkyShop.bug.parse.counter
      }

      if ( $(street).length > 0 ) {
        SkyShop.bug.parse.SelectStreet = {
          error: '',
          streets: $(street).attr('data-streets'),
          selected: $(street).val(),
          counter: SkyShop.bug.parse.counter
        }
      }

      if ( $(street + fake).length > 0 ) {
        SkyShop.bug.parse.street = {
          error: 'shipment event',
          text: $(street + fake).text(),
          counter: SkyShop.bug.parse.counter
        }
      }

    } else {
      SkyShop.bug.parse.shipment.error = 'not changed';
    }
  } else {
    SkyShop.bug.parse.error = 'fake select wasnt picked';
  }

  SkyShop.bug.add();
});

$(document).on('change', '.core_orderShipmentSelect', function (e) {
  var hStreet = '#order-deliverys-methods .core_orderShipmentSelectStreet';
  SkyShop.bug.parse.SelectShipment = {
    key: $(this).attr('data-key'),
    type: $(this).attr('data-type'),
    selected: $(this).val(),
    error: '',
    counter: SkyShop.bug.parse.counter + 0.5
  }

  if ( $(hStreet).length > 0 ) {
    SkyShop.bug.parse.SelectStreet = {
      error: '',
      streets: $(hStreet).attr('data-streets'),
      selected: $(hStreet).val(),
      counter: SkyShop.bug.parse.counter + 0.5;
  }
  } else {
    SkyShop.bug.parse.SelectStreet = {
      error: 'real select not found'
    }
  }

  SkyShop.bug.add();
});

$(document).on('change', '.core_orderShipmentSelectStreet', function (e) {
  SkyShop.bug.parse.SelectStreet = {
    streets: $(this).attr('data-streets'),
    selected: $(this).val(),
    error: '',
    counter: SkyShop.bug.parse.counter + 0.6
  }
  SkyShop.bug.add();
})

/* ================================================================================================================
 * ORDER OPEN MAP PACZKOMATY
 */

$(document).on('click','.core_orderOpenMapPaczkomaty',function(e){
  e.preventDefault();

  var self = $(this),
      order = $('.order');

  var data = {
    mapControl: new mapControl(),
    mapGmapKey: typeof order.data('inpost-gmaps') !== 'undefined' ? order.data('inpost-gmaps') : null
  };

  window.easyPackAsyncInit = function(){
    mapObj.init({
      apiEndpoint: 'https://api-pl-points.easypack24.net/v1',
      locales: ['pl-PL'],
      defaultLocale: 'pl-PL',
      assetsServer: '/inc/shipments/paczkomaty/map/',
      points: {
        types: ['parcel_locker']
      },
      map: {
        googleKey: data.mapGmapKey,
        clusterer: {
          zoomOnClick: true,
          gridSize: 140,
          maxZoom: 16,
          minimumClusterSize: 10
        },
        useGeolocation: true,
        initialZoom: 13,
        defaultLocation: [51.9189046, 19.1343786],
        initialTypes: ['parcel_locker']
      }
    });

    mapObj.mapWidget('easypack-map',function(){},function(){
      $('#easypack-map').find('.list-widget').addClass('scrollbar-inner').scrollbar();
    });
  };

  data.mapControl.setListener(function(e){
    $('#easypack-map').parents('.swal2-container').find('.swal2-confirm').trigger('click');

    var orderDeliveries = order.find('#order-deliverys-methods'),
        orderDeliveriesOpen = orderDeliveries.find('.more.open'),
        orderDeliveriesCity = orderDeliveriesOpen.find('.core_orderShipmentSelect'),
        orderDeliveriesStreet = orderDeliveriesOpen.find('.core_orderShipmentSelectStreet');

    orderDeliveriesCity.val(e.detail.address_details.city).trigger('select2:select',{
      streetsRendered: function(){
        orderDeliveriesCity.val(e.detail.address_details.city).trigger('change');

        setTimeout(function(){
          orderDeliveriesStreet.val(e.detail.name).trigger('change');
        },100);

        setTimeout(function(){
          mapObj.close();
          data.mapControl.remove();
        },200);
      }
    });
  });

  swal({
    width: 800,
    confirmButtonText: '',
    confirmButtonClass: 'close-shape',
    cancelButtonText: '',
    cancelButtonClass: 'hidden',
    title: 'Znajdź i wybierz paczkomat',
    html: '<div id="easypack-map"></div><i class="close-shape"></i>',
    customClass: 'swal-shop-paczkomaty-popup'
  }).then(function(){},function(){
    setTimeout(function(){
      mapObj.close();
      data.mapControl.remove();
    },200);
  });

  $('.swal-shop-paczkomaty-popup').one('click','.close-shape',function(){
    var self = $(this);
    self.parents('.swal2-modal').find('.swal2-cancel').trigger('click');

    setTimeout(function(){
      mapObj.close();
      data.mapControl.remove();
    },200);
  });

  data.mapControl.create();
});


/* ================================================================================================================
 * ORDER BANK SELECT
 */

$(document).on('click','.core_orderBankSelect',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    closeModal: self.parents('.swal2-modal').find('.swal2-confirm'),
    paymentId: self.data('payment'),
    bankId: self.data('id'),
    name: self.data('name'),
    logo: self.data('logo')
  };

  SkyShop.order.paymentId = data.paymentId + '_' + data.bankId + '_' + data.name;
  cookies.create('ac_payment',SkyShop.order.paymentId,60 * 24 * 60 * 60 * 1000);

  var paymentContainer = $('.order').find('[data-payment-selected="' + data.paymentId + '"]');
  paymentContainer.parent().addClass('selected');
  paymentContainer.parent().find('input[name="payment"]').val(SkyShop.order.paymentId).prop('checked',true);
  paymentContainer.find('.fa').addClass('hidden');
  paymentContainer.find('img').removeAttr('data-src').attr('src',data.logo);
  paymentContainer.find('.bank-name').text(data.name);

  if(paymentContainer.parents('.ss-error').eq(0).length > 0){
    removeError(paymentContainer.parents('.ss-error').eq(0));
  }

  data.closeModal.trigger('click');
});


/* ================================================================================================================
 * COPY DATA TO INVOICE
 */

$(document).on('click','.core_copyDataToInvoice',function(e){
  e.preventDefault();

  var self = $(this),
      order = $('.order');

  var data = {
    values: {
      country: order.find('[name="user_country"]').val(),
      companyName: order.find('[name="user_company"]').val(),
      city: order.find('[name="user_city"]').val(),
      postCode: order.find('[name="user_code"]').val(),
      street: order.find('[name="user_street"]').val()
    },
    updateForm: {
      country: order.find('[name="user_bill_country"]'),
      companyName: order.find('[name="user_bill_company"]'),
      city: order.find('[name="user_bill_city"]'),
      postCode: order.find('[name="user_bill_code"]'),
      street: order.find('[name="user_bill_street"]')
    }
  };

  Object.keys(data.updateForm).forEach(function(key){
    var element = data.updateForm[key];

    if(typeof data.values[key] !== 'undefined' && data.values[key] != ''){
      element.val(data.values[key]);
    }
  });

  order.find('.order-country').select2('destroy').select2({
    theme: 'bootstrap',
    width: '100%'
  });
});


/* ================================================================================================================
 * ORDER FORM CHANGE
 */

$(document).on('change','.core_orderFormChange',function(e){
  var self = $(this),
      input = $(e.target),
      inputContainer = false,
      selfTest = false;

  if(input.hasClass('ss-error')){
    inputContainer = input;
    selfTest = true;
  }
  if(input.parents('.ss-error').eq(0).length > 0){
    inputContainer = input.parents('.ss-error').eq(0);
  }
  if(input.nextAll('.ss-error').eq(0).length > 0){
    inputContainer = input.nextAll('.ss-error').eq(0);
  }

  if(!inputContainer){
    return false;
  }

  if(inputContainer.hasClass('ss-error')){
    if(formValidator(inputContainer,selfTest)){
      removeError(inputContainer);
    }
  }
});


/* ================================================================================================================
 * CARD PARAMS CHANGE
 */

$(document).on('change','.core_cardParamsChange',function(e){
  var self = $(this),
      input = $(e.target),
      inputContainer,
      card = self.parents('.product-card');
  if(!input.hasClass('core_cardParamsChange')){
    if(input.parent().hasClass('checkbox-field')){
      inputContainer = input.parents('.choose-field').eq(0);
    }
    if(input.hasClass('select-field-select2')){
      inputContainer = input.nextAll('.select-field-select2-container').eq(0);
    }
    if(inputContainer.hasClass('ss-error')){
      removeError(inputContainer);
    }
  }

  var data = {
    additionals: self.find('input:checked[data-additional-price],option:selected[data-additional-price]'),
    additionalsSum: 0,
    additionalsSumNoDiscount: 0,
    cardPriceSpecial: card.find('.core_cardPriceSpecial'),
    cardPriceDiscountPercent: card.find('.core_cardPriceDiscountPercent'),
    cardPriceDiscount: card.find('.core_cardPriceDiscount'),
    cardPriceBeforeDiscount: card.find('.core_cardPriceBeforeDiscount'),
    noPrice: $('body').attr('data-hurt-price-text'),
    singleParamsArray: ['ean', 'barcode', 'symbol'],
    defaultSingleParams: {
      ean: $(document).find('[data-parameter-value="ean"]').data('parameterDefaultValue'),
      barcode: $(document).find('[data-parameter-value="barcode"]').data('parameterDefaultValue'),
      symbol: $(document).find('[data-parameter-value="symbol"]').data('parameterDefaultValue')
    },
    manageParameterRowVisibility: () => {
      let productParametersRow = document.querySelector('.product-parameters-row');
      let productParameters = document.querySelector('.product-parameters-row .product-parameters')
      var paramElementsAmount = $(productParameters).find('tr').length,
          paramHiddenElementsAmount = $(productParameters).find('tr.hidden').length;
      /* if all parameters are hidden hide row */
      paramElementsAmount === paramHiddenElementsAmount ? productParametersRow.classList.add('hidden') : productParametersRow.classList.remove('hidden')
    },
    getFormData: () => {
      let arr = []
      let selectInputs = self.find($('select'))
      selectInputs.each((index) => {
        let val = selectInputs[index].value;
        if(val.length >= 1) arr.push({ value: val })
      })
      if(arr.length >= 1){
        return arr.concat(self.serializeArray())
      }else{
        return self.serializeArray()
      }
    },
    prodId: self.closest('.product-informations').attr('data-id')
  };

  data.additionals.each(function(){
    var param = $(this),
        additionalPrice = param.data('additional-price'),
        additionalPriceNoDiscount = param.data('additional-price-no-discount');

    data.additionalsSum = Big(data.additionalsSum).plus(additionalPrice);
    if(data.cardPriceBeforeDiscount.length > 0){
      data.additionalsSumNoDiscount = Big(data.additionalsSumNoDiscount).plus(additionalPriceNoDiscount);
    }
  });

  data.additionalsSum = Big(
      data.cardPriceSpecial.data('price-default') != data.noPrice ? data.cardPriceSpecial.data('price-default') : 0
  ).plus(data.additionalsSum);
  if(data.cardPriceBeforeDiscount.length > 0){
    data.additionalsSumNoDiscount = Big(
        data.cardPriceBeforeDiscount.data('price-default') != data.noPrice ? data.cardPriceBeforeDiscount.data('price-default') : 0
    ).plus(data.additionalsSumNoDiscount);
  }

  data.cardPriceSpecial.data('price',data.additionalsSum);
  data.cardPriceBeforeDiscount.data('price',data.additionalsSumNoDiscount);

  pricesFormatter(card);

  function manageParameterVisibility(element, params){
    params ? element.classList.remove('hidden') : element.classList.add('hidden')
  }

  function setSingleParams(array, params){
    /* IF PARAMS ARE NOT PASSED THEN USE DEFAULT ONES */
    let productParams = {};
    params ? productParams = params : productParams = data.defaultSingleParams;
    /* MANAGE EVERY PARAMETER FROM ARRAY */
    array.map(el => {
      const currentElement = document.querySelector('[data-parameter-value="' + el + '"]')
      const displayElement = currentElement.querySelector('[data-display-selector]')
      if(currentElement.dataset.parameterDisplay > 0){
        let defaultValue = currentElement.dataset.parameterDefaultValue
        let selectedOptionsArray = data.getFormData();
        selectedOptionsArray.length >= 1 ? displayElement.innerHTML = productParams[el] : displayElement.innerHTML = defaultValue
        manageParameterVisibility(currentElement, productParams[el])
      }
    });
  }
  function setAvailabilityParams(params){
    const selectors = {
      text: document.querySelector('[data-parameter-value="availability_amount_text"]'),
      img: document.querySelector('[data-parameter-value="availability_img"]'),
      number: document.querySelector('[data-parameter-value="availability_amount_number"]'),
      unit: document.querySelector('[data-parameter-value="availability_unit"'),
    }
    const defaultValues = {
      text: selectors.text ? selectors.text.dataset.parameterDefaultValue : '',
      img: selectors.img ? selectors.img.dataset.parameterDefaultValue : '',
      number: selectors.number ? selectors.number.dataset.parameterDefaultValue : ''
    }
    const selectedOptionsArray = data.getFormData();
    const { text, number, unit, img } = selectors
    if(selectedOptionsArray.length >= 1) { /* if user clicked at least one parameter */
      if(typeof params === 'object'){ /* if is object it means it's text value and can contain image */
        if(text) text.innerHTML = params.name
        if(params.img){
          if(img) img.classList.remove('hidden')
          if(img) img.setAttribute('src', params.img)
        }else{
          if(img) img.removeAttribute('src')
          if(img) img.classList.add('hidden')
        }
      }else{ /* else it's number value*/
        if(number) number.innerHTML = params
      }
    }else{ /* else get default values back */
      if(defaultValues.text){ /* VISIBILITY: if values are text type */
        if(text) text.classList.remove('hidden')
        if(number) number.classList.add('hidden')
        if(unit) unit.classList.add('hidden')
      }else{ /* VISIBILITY: if values are number type */
        if(text) text.classList.add('hidden')
        if(img) img.classList.add('hidden')
        if(number) number.classList.remove('hidden')
        if(unit) unit.classList.remove('hidden')
      }
      /* set values */
      if(text) text.innerHTML = defaultValues.text
      if(img) img.innerHTML = defaultValues.img
      if(number) number.innerHTML = defaultValues.number
    }
  }
  // Update stocks
  function updateStocks(res){
    let newParams = res.data;
    setSingleParams(data.singleParamsArray, newParams);
    setAvailabilityParams(newParams.availability);
    /* IF THERE IS NO PARAMETES THEN HIDE ROW (avoid showing border) */
    data.manageParameterRowVisibility();
  }
  // Sending a request for warehouse stocks managment
  function getParticularStocks(id, params){
    return $.ajax({
      method: 'POST',
      url: '?json=1&action=getStockValuesByParams',
      data: {
        id: id,
        options: params,
      },
      dataType: 'json',
      success: function(data){
        updateStocks(data)
      }
    })
  }
  /* IF IS RENDERED FIRST TIME, THEN AVOID SENDING UNNECESSARY REQUEST */
  if(window.SkyShop.card.allowStockRequest){
    let selectedOptionsArray = data.getFormData();
    let selectedParametersArray = selectedOptionsArray.map(opt => opt.value);
    let selectedParametersString = selectedParametersArray.join(',');
    getParticularStocks(data.prodId, selectedParametersString);
  }else{
    window.SkyShop.card.allowStockRequest = true;
    setSingleParams(data.singleParamsArray);
    /* IF THERE IS NO PARAMETES THEN HIDE ROW (avoid showing border) */
    data.manageParameterRowVisibility();
  }
});


/* ================================================================================================================
 * CARD STOCKS MANAGE
 */

$(document).on('stockManage','.core_cardStocksManage',function(e,parameters){
  var product = $(this);

  product.each(function(){
    var self = $(this);

    if(typeof self.data('stocks') === 'undefined'){
      return;
    }

    var data = {
      isCart: self.parents('section.cart').length > 0 ? true : false,
      maxAmount: 0,
      stocks: null,
      hash: null
    };

    if(data.isCart){
      data.hash = product.parents('[data-hash]').eq(0).data('hash');
    }else{
      data.hash = product.parents('[data-id]').eq(0).data('id');
    }

    if(typeof SkyShop.card.stocks.storable[data.hash] === 'undefined'){
      SkyShop.card.stocks.storable[data.hash] = JSON.parse(JSON.stringify(SkyShop.card.stocks.pattern));
    }

    data.stocks = SkyShop.card.stocks.storable[data.hash].stocks;

    if(data.stocks == null){
      data.stocks = SkyShop.card.stocks.storable[data.hash].stocks = self.data('stocks');

      var countParams = {},
          emptyStocks = [];

      data.stocks.stocks.forEach(function(stock){
        stock.items.forEach(function(item){
          if(typeof countParams[item.option_id] === 'undefined'){
            countParams[item.option_id] = {
              group_id: item.group_id,
              option_id: item.option_id,
              count: 0
            };
          }

          if(stock.amount > 0){
            countParams[item.option_id].count++;
          }
        });
      });

      Object.keys(countParams).forEach(function(key){
        if(countParams[key].count == 0){
          var field = self.find('[data-key="' + countParams[key].group_id + '"]');

          if(field.hasClass('select-field-select2')){
            field.find('option[value="' + countParams[key].option_id + '"]').attr('disabled','disabled');
          }else{
            field.find('input[value="' + countParams[key].option_id + '"]').parent().addClass('disable');
          }
        }
      });
    }

    var setParameter = function(element){
      data.maxAmount = 0;

      var input = element.hasClass('select-field-select2') ? element.find('option:checked') : element,
          stocksSelected = [],
          param = {
            id: parseFloat(input[0].getAttribute('name').split('_')[1]),
            option: parseFloat(input[0].value)
          };

      if(data.stocks.groups.indexOf(param.id) > -1){
        if(SkyShop.card.stocks.storable[data.hash].stocksSelectedLastGroup != param.id){
          SkyShop.card.stocks.storable[data.hash].stocksSelectedLast = JSON.parse(JSON.stringify(SkyShop.card.stocks.storable[data.hash].stocksSelected));
        }

        SkyShop.card.stocks.storable[data.hash].stocksSelectedLastGroup = param.id;
        SkyShop.card.stocks.storable[data.hash].stocksSelected[param.id] = param.option;

        data.stocks.stocks.forEach(function(stock){
          var count = 0,
              countLast = 0,
              search = Object.keys(SkyShop.card.stocks.storable[data.hash].stocksSelected).length,
              searchLast = Object.keys(SkyShop.card.stocks.storable[data.hash].stocksSelectedLast).length;

          if(stock.amount > 0){
            stock.items.forEach(function(item){
              if(item.option_id == SkyShop.card.stocks.storable[data.hash].stocksSelected[item.group_id]){
                count++;
              }
            });

            /* Próba zrobienia żeby to fajnie działało - wymaga doróbki */
            // if(searchLast > 0 && count < search){
            //   stock.items.forEach(function(item){
            //     if(item.option_id == SkyShop.card.stocks.storable[data.hash].stocksSelectedLast[item.group_id]){
            //       countLast++;
            //     }
            //   });
            // }
          }

          if(count == search || countLast == searchLast && countLast > 0){
            stocksSelected.push(stock);
          }
        });

        data.stocks.stocks[0].items.forEach(function(item){
          var field = self.find('[data-key="' + item.group_id + '"]');

          if(field.hasClass('select-field-select2')){
            field.find('option').attr('disabled','disabled');
          }else{
            field.find('input[type="radio"]').parent().addClass('disable');
          }
        });

        stocksSelected.forEach(function(item){
          if(item.amount > data.maxAmount){
            data.maxAmount = item.amount;
          }

          item.items.forEach(function(option){
            var field = self.find('[data-key="' + option.group_id + '"]');

            if(field.hasClass('select-field-select2')){
              field.find('option[value="' + option.option_id + '"]').removeAttr('disabled');
            }else{
              field.find('input[value="' + option.option_id + '"]').parent().removeClass('disable');
            }
          });
        });

        self.find('.choose-field').each(function(){
          var choose = $(this),
              chooseDisabled = choose.find('.checkbox-field.disable'),
              chooseSelected = choose.find('input:checked'),
              chooseClear = choose.find('.selection-clear'),
              chooseSize = 'small';

          if(chooseSelected.length > 0 && chooseClear.length == 0 && SkyShop.card.stocks.storable[data.hash].stocks.groups.indexOf(choose.data('key')) > -1){
            if(chooseDisabled.eq(0).hasClass('medium')){
              chooseSize = 'medium';
            }
            if(chooseDisabled.eq(0).hasClass('big')){
              chooseSize = 'big';
            }

            choose.append([
              '<div class="selection-clear ' + chooseSize + '">',
              '&times;',
              '</div>'
            ].join(''));
          }
        });

        self.find('.select-field-select2').each(function(){
          var select = $(this),
              selectOptions = select.data('select2').options.options,
              selectError = false;

          if(select.nextAll('.ss-error').eq(0).length > 0){
            selectError = true;
            removeError(select.nextAll('.ss-error').eq(0));
          }
          if(selectError){
            addError(select.next(),select.data('required-error'));
          }
          select.select2('destroy').select2(selectOptions).next().addClass('select-field-select2-container');
        });

        var inputAmount = data.isCart ? self.parents('[data-hash]').eq(0).find('.product-count').find('.counter-field').find('input') : self.parents('.product-informations').eq(0).find('.product-add-to-cart').find('input');
        inputAmount.data('max',data.maxAmount);

        if(parseFloat(inputAmount.val()) > data.maxAmount){
          inputAmount.val(data.maxAmount);
        }
      }
    };

    var clearParameter = function(element,type){
      data.maxAmount = 0;

      var input = element.hasClass('choose-field') ? element.find('input:checked') : element,
          stocksSelected = [],
          param = {
            id: parseFloat(input[0].getAttribute('name').split('_')[1]),
            option: parseFloat(input[0].value)
          };

      if(data.stocks.groups.indexOf(param.id) > -1){
        if(type == 'choose-field'){
          element.find('input:checked').prop('checked',false);
          element.find('.selection-clear').remove();
        }

        SkyShop.card.stocks.storable[data.hash].stocksSelectedLastGroup = null;
        delete SkyShop.card.stocks.storable[data.hash].stocksSelected[param.id];

        if(Object.keys(SkyShop.card.stocks.storable[data.hash].stocksSelected).length == 0){
          data.stocks.stocks[0].items.forEach(function(item){
            var field = self.find('[data-key="' + item.group_id + '"]');

            if(field.hasClass('select-field-select2')){
              field.find('option').removeAttr('disabled');
            }else{
              field.find('input[type="radio"]').parent().removeClass('disable');
            }
          });

          Object.keys(countParams).forEach(function(key){
            if(countParams[key].count == 0){
              var field = self.find('[data-key="' + countParams[key].group_id + '"]');

              if(field.hasClass('select-field-select2')){
                field.find('option[value="' + countParams[key].option_id + '"]').attr('disabled','disabled');
              }else{
                field.find('input[value="' + countParams[key].option_id + '"]').parent().addClass('disable');
              }
            }
          });
        }else{
          data.stocks.stocks.forEach(function(stock){
            var count = 0,
                countLast = 0,
                search = Object.keys(SkyShop.card.stocks.storable[data.hash].stocksSelected).length,
                searchLast = Object.keys(SkyShop.card.stocks.storable[data.hash].stocksSelectedLast).length;

            if(stock.amount > 0){
              stock.items.forEach(function(item){
                if(item.option_id == SkyShop.card.stocks.storable[data.hash].stocksSelected[item.group_id]){
                  count++;
                }
              });
            }

            if(count == search || countLast == searchLast && countLast > 0){
              stocksSelected.push(stock);
            }
          });

          data.stocks.stocks[0].items.forEach(function(item){
            var field = self.find('[data-key="' + item.group_id + '"]');

            if(field.hasClass('select-field-select2')){
              field.find('option').attr('disabled','disabled');
            }else{
              field.find('input[type="radio"]').parent().addClass('disable');
            }
          });

          stocksSelected.forEach(function(item){
            if(item.amount > data.maxAmount){
              data.maxAmount = item.amount;
            }

            item.items.forEach(function(option){
              var field = self.find('[data-key="' + option.group_id + '"]');

              if(field.hasClass('select-field-select2')){
                field.find('option[value="' + option.option_id + '"]').removeAttr('disabled');
              }else{
                field.find('input[value="' + option.option_id + '"]').parent().removeClass('disable');
              }
            });
          });
        }

        setTimeout(function(){
          self.find('.select-field-select2').each(function(){
            var select = $(this),
                selectOptions = select.data('select2').options.options;

            select.select2('destroy').select2(selectOptions).next().addClass('select-field-select2-container');
          });
        },0);

        var inputAmount = data.isCart ? self.parents('[data-hash]').eq(0).find('.product-count').find('.counter-field').find('input') : self.parents('.product-informations').eq(0).find('.product-add-to-cart').find('input');
        inputAmount.data('max',data.maxAmount);

        if(parseFloat(inputAmount.val()) > data.maxAmount){
          inputAmount.val(data.maxAmount);
        }
      }
    };

    self.on('click','input[type="radio"], select.select-field-select2',function(){
      setParameter($(this));
    });

    self.on('select2:unselecting','.select-field-select2',function(){
      $(this).data('unselecting',true);

      clearParameter($(this).find('option[value="' + $(this).val() + '"]'),'select-field');
    }).on('select2:opening','.select-field-select2',function(e){
      if($(this).data('unselecting')){
        $(this).removeData('unselecting');
        e.preventDefault();
      }
    });
    self.on('click','.selection-clear',function(){
      clearParameter($(this).parents('.choose-field'),'choose-field');
    });

    if(typeof parameters !== 'undefined'){
      if(typeof parameters.build !== 'undefined'){
        parameters.build(product);
      }
    }
  });
});

$(document).on('ready',function(){
  var stockManage = $(document).find('.core_cardStocksManage');

  if(stockManage.parents('section.product-card').eq(0).length > 0){
    stockManage.trigger('stockManage');
  }
});


/* ================================================================================================================
 * CART FREE SHIPMENT LISTENER
 */

$(document).find('.core_cartFreeShipmentListener').each(function(){
  var self = $(this),
      body = $('body');

  var cartFreeShipmentListener = function(self){
    var freeShipmentValue;

    if(self.data('free-shipment') != ''){
      if(typeof self.data('free-shipment-type') !== 'undefined' && self.data('free-shipment-type') == 'netto'){
        freeShipmentValue = bruttoToNetto(self.data('free-shipment'),body.attr('data-tax'));
      }else{
        freeShipmentValue = self.data('free-shipment');
      }
    }else{
      freeShipmentValue = '';
    }

    var data = {
      freeShipmentValue: freeShipmentValue,
      cartSum: self.data('price'),
      toFreeShipment: 0,
      cartIsFreeShipment: $('.core_cartIsFreeShipment'),
      cartIsFreeShipmentActive: $('.core_cartIsFreeShipmentActive'),
      cartFreeShipment: $('.core_cartFreeShipment')
    };

    if(data.freeShipmentValue != ''){
      data.freeShipmentValue = parseFloat(data.freeShipmentValue);
      data.toFreeShipment = Big(data.freeShipmentValue).minus(data.cartSum);

      if(data.toFreeShipment > 0){
        data.cartIsFreeShipment.removeClass('hidden');
        data.cartIsFreeShipmentActive.addClass('hidden');
        data.cartFreeShipment.data('price',data.toFreeShipment);
      }else{
        data.cartIsFreeShipment.addClass('hidden');
        data.cartIsFreeShipmentActive.removeClass('hidden');
      }

      pricesFormatter(data.cartIsFreeShipment);
    }
  }

  cartFreeShipmentListener(self);

  $(document).on('DOMSubtreeModified','.core_cartFreeShipmentListener',function(){
    cartFreeShipmentListener(self);
  });
});


/* ================================================================================================================
 * CART PARAMS CHANGE
 */

$(document).on('change','.core_cartParamsChange',function(e){
  var self = $(this),
      target = $(e.target);

  var data = {
    id: target.data('key'),
    hash: self.parents('[data-hash]').data('hash'),
    value: target.val()
  };

  SkyShop.cart.products[data.hash].options[data.id] = data.value;

  if(data.value == '' || data.value == null){}else{
    cartUpdate({
      hash: [data.hash]
    });
  }
});


/* ================================================================================================================
 * COUNTER VALUE
 */

$(document).on('change focus blur keyup valueincrease valuedecrease','.core_counterValue',function(e){
  var self = $(this),
      counter = self.parents('.counter-field').eq(0);

  clearTimeout(SkyShop.card.counterError);
  removeError(counter);

  var data = {
    value: self.val(),
    remember: self.data('remember'),
    min: self.data('real-min') ? parseFloat(self.data('real-min')) : parseFloat(self.data('min')),
    max: parseFloat(self.data('max')),
    tick: parseFloat(self.data('tick')),
    boxamount: parseFloat(self.data('boxamount')),
    boxrestrict: parseFloat(self.data('boxrestrict')),
    realMin: parseFloat(self.data('real-min')),
    rules: {
      onlyNaturalPositive: /^\d*[1-9]\d*$/,
      withDotOrComma: /^\d+(?:\.\d{0,4})?$/
    },
    isOnlyWholePackages: self.data('boxrestrict-whole'),
    isAllowDotOrComma: function (){
      if (self.data('boxrestrict-whole') == false) {
        if (self.data('min').toString().replace(',', '.').split('.')[1] != 'undefined' ||
            self.data('data-boxrestrict').toString().replace(',', '.').split('.')[1] != 'undefined') {
          return true;
        }
        else {
          return false;
        }
      } else {
        return false;
      }
    }(),
    setError: function(message){
      addError(counter,message);

      counter.prev().children('.ss-error-help-open').trigger('mouseenter');

      SkyShop.card.counterError = setTimeout(function(){
        removeError(counter);
      },1500);
    },
    getNearDiv: function(value,div){
      var q = (Big(value).div(div) | 0),
          output1 = Big(div).times(q),
          output2 = (Big(value).times(div)) > 0 ? (Big(div).times((Big(q).plus(1)))) : (Big(div).times((Big(q).minus(1))));

      if(Math.abs(Big(value).minus(output1)) < Math.abs(Big(value).minus(output2))){
        if(output1 < data.min){
          return data.min;
        }
        if(output1 > data.max){
          return data.max;
        }
        return output1;
      }else{
        if(output2 < data.min){
          return data.min;
        }
        if(output2 > data.max){
          return data.max;
        }
        return output2;
      }
    }
  };

  switch(e.type){
    case 'change': // Trigger when focusout input and was changes
      var value = data.value,
          rule = data.isAllowDotOrComma ? data.rules.withDotOrComma : data.rules.onlyNaturalPositive,
          max = !isNaN(parseFloat(self.val())) ? data.getNearDiv(parseFloat(self.val()), data.tick) : null,
          tmp = 0;

      max = max !== null ? parseFloat(max) : null;

      if (data.value.toString !== '') {
        if (parseFloat(data.remember) < data.realMin) {
          data.remember = data.realMin;
        } else {
          data.remember = data.value;
        };
        self.val(data.remember)
      }

      if(value.indexOf(',')){
        value = data.value.replace(',','.');
      }

      if(!rule.test(value)){
        value = data.remember;
      }else{
        if(data.isOnlyWholePackages){
          value = Big(Math.floor(Big(value).div(data.boxrestrict))).times(data.boxrestrict);
          if (value < data.realMin) {
            value = data.realMin;
          }
        }else{
          value = data.getNearDiv(parseFloat(value),data.boxrestrict);
          if (value < data.realMin) {
            value = data.realMin;
          }

          if (max !== null && max >= data.max && Big(max).div(data.tick).mod(1) !== 0 ) {
            while ( Big(tmp).plus(data.tick) <= data.max ) {
              tmp = Big(tmp).plus(data.tick);
            }
            value = tmp;
          }
        }
      }

      self.val(value);
      break;
    case 'focusin': // Triger on focus
      self.data('remember',data.value);
      data.remember = data.value;
      self.val('');
      break;
    case 'focusout': // Trigger on blur
      if(!self.val().replace(/^\s+/g,'').length){
        self.val(data.remember);
      }
      break;
    case 'valueincrease': // Triger when click increase button
      var value = Big(parseFloat(data.value)).plus(
          typeof self.data('tick') !== 'undefined' ? data.tick : data.min
      );

      if(value <= data.max){
        self.val(value);
      }else{
        data.setError('Osiągnięto maksymalną ilość');
      }
      break;
    case 'valuedecrease': // Triger when click decrease button
      var value = Big(parseFloat(data.value)).minus(
          typeof self.data('tick') !== 'undefined' ? data.tick : data.min
      );

      if(value >= data.min){
        self.val(value);
      }else{
        data.setError('Osiągnięto minimalną ilość');
      }
      break;
    case 'keyup': // Control what is bind from keyboard
      var value = data.value.replace(',','.'),
          split = value.split(''),
          rule = data.isAllowDotOrComma ? data.rules.withDotOrComma : data.rules.onlyNaturalPositive;

      if(!rule.test(value)){
        split.splice(-1,1);
        self.val(split.join(''));
      }

      break;
  }
});


/* ================================================================================================================
 * COUNTER VALUE CHANGE
 */

$(document).on('click','.core_counterValueChange',function(e){
  var self = $(this);

  var data = {
    type: 'value' + self.data('type'),
    counter: self.parents('.counter-field').eq(0).find('.core_counterValue')
  };

  if(data.counter.length > 0){
    data.counter.trigger(data.type).trigger('change');
  }
});


/* ================================================================================================================
 * SET LANGUAGE
 */

$(document).on('click','.core_setLanguage',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {

  };


});


/* ================================================================================================================
 * ADD TO CART
 */

$(document).on('click','.core_addToCart',function(e){
  e.preventDefault();

  var self = $(this),
      productCard = self.parents('.product-card');

  if(self.parents('.product-tile').length > 0){
    self.parents('.product-tile').addClass('product-hover');
  }

  removeAllErrors(productCard);

  var options = {},
      errors = {};

  if(productCard.length > 0){
    productCard.find('.core_parseOption').each(function(){
      var option = $(this);
      if(typeof option.data('required') !== 'undefined' && option.data('required') === true){
        if(option.hasClass('select-field-select2')){
          if(option.val() == '' || option.val() == null){
            errors[option.data('key')] = 'required';
          }else{
            options[option.data('key')] = option.val();
          }
        }else{
          if(option.find('input:checked').length == 0){
            errors[option.data('key')] = 'required';
          }else{
            options[option.data('key')] = option.find('input:checked').val();
          }
        }
      }
      if(typeof option.data('required') !== 'undefined' && option.data('required') === false){
        if(option.hasClass('select-field-select2')){
          if(option.val() != ''){
            options[option.data('key')] = option.val();
          }
        }else{
          if(option.find('input:checked').length > 0){
            options[option.data('key')] = option.find('input:checked').val();
          }
        }
      }
    });
  }
  if(Object.keys(errors).length > 0){
    $.each(errors,function(optionId,type){
      var errorContainer = $('.core_parseOption[data-key="' + optionId + '"]'),
          errorContainerElement = errorContainer;
      if(errorContainer.hasClass('select-field-select2')){
        errorContainerElement = errorContainer.next();
      }

      if(type == 'required'){
        addError(errorContainerElement,errorContainer.data('required-error'));
      }
    });
    return false;
  }

  var data = {
    productId: self.data('product-id'),
    amount: parseFloat(self.parents('.product-card').find('.counter-field').find('input').val()),
    option: $.base64Encode(JSON.stringify(options)),
    dropRef: $.base64Encode(location.pathname)
  };
  var url = '/cart/?json=1&p=' + data.productId + '&a=' + (!parseFloat(data.amount) ? 1 : data.amount) + '&o=' + data.option + '&drop_ref=' + data.dropRef;

  $.getJSON(url,function(response){
    if(response.user_error){
      popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.user_error,'error');
    }else{
      if(response.redirect_to_product == 1 || response.redirect == 1){
        if(response.redirect_to_product == 1){
          window.location = response.url + '#opt_reqired_info';
        }
        if(response.redirect == 1){
          window.location = '/cart/';
        }
      }else{
        if(response.message != ''){
          popups.actionAlert(L['INFORMATION'],response.message,'info',function(){
            popups.addToCart(function(){
              if(self.parents('.product-tile').length > 0){
                self.parents('.product-tile').removeClass('product-hover');
              }
            });
          });
        }else{
          popups.addToCart(function(){
            if(self.parents('.product-tile').length > 0){
              self.parents('.product-tile').removeClass('product-hover');
            }
          });
        }
        updateCart('add',response,{});
      }
    }
  }).error(function(){
    popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['PLEASE_TRY_AGAIN'],'error');
  });
});


/* ================================================================================================================
 * REMOVE PARAMETER
 */

$(document).on('click','.core_removeParameter',function(e){
  e.preventDefault();

  var self = $(this);

  self.parents('label').trigger('click');
  setTimeout(function(){
    self.parents('form').submit();
  },50);
});


/* ================================================================================================================
 * SHOW ALL PARAMETERS
 */

$(document).on('click','.core_showAllParameters',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    template: {
      elements: self.parents('tr[data-hash]').eq(0).find('.product-parameters').find('[class*=product-parameters-]:not(.product-parameters-all)'),
      table: [
        '<table class="product-parameters">',
        '{{:parameters:}}',
        '</table>'
      ].join(''),
      item: [
        '<tr>',
        '<td>{{:name:}}</td>',
        '<td>{{:option:}}</td>',
        '</tr>'
      ].join('')
    },
    values: {}
  };

  var manage = {
    getValue: function(select){
      var option = {
        key: select.data('key'),
        value: select.val()
      };

      data.values[option.key] = option.value;
    },
    getValues: function(){
      var container = $('.swal-shop-parameters-popup'),
          values = container.find('select.select-field-select2');

      values.each(function(){
        var select = $(this);

        var option = {
          key: select.data('key'),
          value: select.val()
        };

        data.values[option.key] = option.value;
      });
    },
    update: function(){
      var hash = data.template.elements.parents('[data-hash]').data('hash');

      data.template.elements.each(function(){
        var item = $(this),
            option, key;

        if(item.hasClass('product-parameters-select')){
          item = item.find('.select-field-select2');
          key = item.data('key');
          option = data.values[key];

          if(option != void 0){
            SkyShop.cart.products[hash].options[key] = option;

            item.find('option[selected]').removeAttr('selected');
            item.val(option).find('option[value="' + option + '"]').attr('selected','selected');
          }
        }
      });

      data.template.elements.find('.select-field-select2').select2('destroy');

      initializeSelect2(data.template.elements.find('.select-field-select2'));

      cartUpdate({
        hash: [hash]
      });
    },
    render: function(){
      var table = data.template.table,
          items = '';

      data.template.elements.each(function(){
        var item = $(this),
            template = data.template.item;

        var option = {
          name: item.children('td').eq(0).html(),
          value: item.children('td').not(':eq(0)').not('.hidden')
        };

        template = template.replace(/{{:name:}}/g,option.name);

        if($(option.value).hasClass('product-option-select')){
          option.option = $(option.value).find('.select-field-select2')[0].outerHTML;
        }
        if($(option.value).hasClass('product-option-text')){
          option.option = $(option.value).children()[0].outerHTML;
        }

        template = template.replace(/{{:option:}}/g,option.option);

        items = items + template;
      });

      table = table.replace(/{{:parameters:}}/g,items);

      return $(table);
    }
  };

  swal({
    width: 500,
    customClass: 'swal-shop-parameters-popup',
    confirmButtonText: L['APPLY'],
    confirmButtonClass: 'btn',
    title: L['PARAMETERS_LIST'],
    html: manage.render(),
    onOpen: function(){
      var container = $('.swal-shop-parameters-popup');

      initializeSelect2(container.find('.select-field-select2'),{
        dropdownParent: container
      });

      container.find('.select-field-select2').on('change',function(){
        manage.getValue($(this));
      });
      manage.getValues();
    }
  }).then(function(event){
    manage.update();
  });
});


/* ================================================================================================================
 * REMOVE FROM CART
 */

$(document).on('click','.core_removeFromCart',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    id: self.parents('[data-hash]').data('id'),
    hash: self.parents('[data-hash]').data('hash'),
    amount: self.parents('[data-hash]').find('input[name*="amount_"]').val(),
    amountQuick: self.parents('[data-hash]').data('amount')
  };

  if(typeof data.amount === 'undefined'){
    data.amount = data.amountQuick;
  }

  var url = '/cart/?json=1&rem=rem_' + data.hash + '_' + data.amount;

  $.getJSON(url,function(response){
    if(response.user_error){
      popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.user_error,'error');
    }else{
      var inCart = typeof data.id === 'undefined' ? false : true;

      if(inCart){
        updateCart('remove',response,{
          hash: data.hash,
          inCart: inCart,
          callback: function(){
            cartUpdate();
          }
        });
      }else{
        updateCart('remove',response,{
          hash: data.hash,
          inCart: inCart
        });
      }
    }
  });
});


/* ================================================================================================================
 * ADD TO STORE
 */

$(document).on('click','.core_addToStore',function(e){
  e.preventDefault();

  var self = $(this);

  if(self.parents('.product-tile').length > 0){
    self.parents('.product-tile').addClass('product-hover');
  }

  var data = {
    productId: self.data('product-id')
  };
  var url = '/cart/?json=1&store=1&p=' + data.productId;

  $.getJSON(url,function(response){
    if(response.user_error){
      popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],json.user_error,'error');
    }else{
      popups.actionAlert(L['INFORMATION'],L['PRODUCT_ADDED_TO_STORE'],'success',function(){
        if(self.parents('.product-tile').length > 0){
          self.parents('.product-tile').removeClass('product-hover');
        }
      });
    }
  }).error(function(){
    popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['PLEASE_TRY_AGAIN'],'error');
  });
});


/* ================================================================================================================
 * REMOVE FROM STORE
 */

$(document).on('click','.core_removeFromStore',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    productId: self.data('product-id')
  };
  var url = '/cart/?json=1&rem_store=' + data.productId;

  $.getJSON(url,function(response){
    if(response.user_error){
      popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],json.user_error,'error');
    }else{
      self.parents('figure').eq(0).parent().remove();
      popups.actionAlert(L['INFORMATION'],L['PRODUCT_REMOVED_FROM_STORE'],'success');
    }
  }).error(function(){
    popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['PLEASE_TRY_AGAIN'],'error');
  });
});


/* ================================================================================================================
 * ASK QUESTION OPEN POPUP
 */

$(document).on('click','.core_askQuestionOpenPopup',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    productId: self.data('product-id')
  };

  popups.askAboutProduct(data.productId);
});


/* ================================================================================================================
 * ASK QUESTION
 */

$(document).on('click','.core_askQuestion',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    productId: self.data('product-id'),
    username: self.parents('form').eq(0).find('input[name="username"]').val(),
    email: self.parents('form').eq(0).find('input[name="email"]').val(),
    text: self.parents('form').eq(0).find('textarea[name="text"]').val(),
    validate: formValidator(self.parents('form').eq(0)),
    is_js: self.parents('form').find('.pro-tecting-_-Input').val()
  };
  var url = '/product/?json=1&action=phone';

  if(data.validate){
    $.post(url,{
      prod_id: data.productId,
      email: data.email,
      sky_validate: 1,
      body: L['SIGNATURE'] + ': ' + data.username + '<hr />' + data.text,
      is_js: data.is_js
    },function(response){
      response = JSON.parse(response);

      if(response.msg){
        popups.actionAlert(L['EMAIL_WAS_SENT'],response.msg,'success');
      }else if(response.error) {
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.error_msg,'error');
      }else{
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['ERROR_CRITICAL_MESSAGE'],'error');
      }
    });
  }
});


/* ================================================================================================================
 * SEND PHONE
 */

$(document).on('click','.core_sendPhone',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    productId: self.parent().find('input[name="phone_number_box"]').data('product-id'),
    number: self.parent().find('input[name="phone_number_box"]').val(),
    is_js: self.parent().find('.pro-tecting-_-Input').val()
  };
  var url = '/product/?json=1&action=phone';

  if(!isNaN(parseFloat(data.number.split(' ').join(''))) && data.number.match(/\d/g).length > 6){
    $.post(url,{
      prod_id: data.productId,
      phone: data.number,
      is_js: data.is_js
    },function(response){
      response = JSON.parse(response);

      if(response.msg){
        popups.actionAlert(L['NUMBER_WAS_SENT'],response.msg,'success');

        self.parents('.row').eq(0).transition('slideUp',200,function(){
          self.parents('.row').eq(0).remove();
        });
      }else if(response.error) {
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.error_msg,'error');
      }else{
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['ERROR_CRITICAL_MESSAGE'],'error');
      }
    });
  }else{
    popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['ERROR_PHONE_IS_INVALID'],'error');
  }
});


/* ================================================================================================================
 * ADD OPINION
 */

$(document).on('click','.core_addOpinion',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    productId: self.attr('name'),
    username: self.parents('form').find('input[name="username"]').val(),
    text: self.parents('form').find('textarea[name="text"]').val(),
    quality: self.parents('form').find('input[name="quality"]').val(),
    usability: self.parents('form').find('input[name="usability"]').val(),
    price: self.parents('form').find('input[name="price"]').val(),
    is_js: self.parents('form').find('.pro-tecting-_-Input').val()
  };
  var url = window.location.pathname + '/json/1';

  if(!data.username || !data.quality || !data.usability || !data.price || !data.text){
    popups.actionAlert(L['PRODUCT_WAS_NOT_EVALUATED'],L['ADD_RATING_MUST_BE_COMPLETED_WITH_ALL_SIGNATURES'],'error');
  }else{
    $.post(url,{
      ajax: 1,
      quality: data.quality,
      usability: data.usability,
      price: data.price,
      username: data.username,
      text: data.text,
      is_js: data.is_js
    },function(response){
      response = JSON.parse(response);
      if(response.user_error){
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.user_error,'error');
      }else if(response.errors){
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.errors[0].split(' '),'error');
      }else{
        popups.actionAlert(L['RATING_HAS_BEEN_ADDED'],response.message,'success');

        self.parents('form').transition('slideUp',1000);
      }
    });
  }
});


/* ================================================================================================================
 * LOAD CART
 */

$(document).find('.core_loadCart').each(function(){
  var self = $(this);

  cartUpdate({
    wait: 0,
    rendered: function(){
      self.find('.core_cardStocksManage').trigger('stockManage',[{
        build: function(stock){
          stock.find('.product-parameters-select').each(function(){
            var select = $(this).find('.select-field-select2'),
                value = select.find('[data-selected]').val();

            if(typeof value !== 'undefined'){
              select.val(value).trigger('click');
            }
          });
        }
      }]);
    }
  });
});


/* ================================================================================================================
 * LOAD CARD
 */

$(document).find('.core_loadCard').each(function(){
  var self = $(this);

  self.find('.core_cardParamsChange').trigger('change');
});


/* ================================================================================================================
 * ADD DISCOUNT COUPON
 */

$(document).on('click','.core_addDiscountCoupon',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    code: self.parents('.row').find('input[name="code_discount"]').val()
  };

  if(data.code != ''){
    cookies.create('ac_code',data.code,0);

    cartUpdate({
      wait: 100,
      blockade: 1000
    },function(){
      popups.actionAlert(L['INFORMATION'],L['COUPON_ACTIVATE'],'success');
    });
  }
});


/* ================================================================================================================
 * REMOVE DISCOUNT COUPON
 */

$(document).on('click','.core_removeDiscountCoupon',function(e){
  e.preventDefault();

  cookies.erase('ac_code');

  cartUpdate({
    blockade: 1000
  });
});


/* ================================================================================================================
 * USE LOYALTY POINTS
 */

$(document).on('click','.core_useLoyaltyPoints',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    loyalty: self.data('points')
  };

  cookies.create('ac_loyalty',data.loyalty,0);

  cartUpdate({
    blockade: 1000
  });
});


/* ================================================================================================================
 * SET LOYALTY POINTS
 */

$(document).on('change','.core_setLoyaltyPoints',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    loyalty: self.val()
  };

  cookies.create('ac_loyalty',data.loyalty,0);

  cartUpdate({
    wait: 300
  });
});


/* ================================================================================================================
 * REGISTER FORM
 */

$(document).on('submit','.core_registerForm',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    validate: formValidator(self),
    name: 'sky_validate',
    value: 1
  };

  if(data.validate){
    self.append($('<input type="hidden" name="' + data.name + '" value="' + data.value + '" />'));
    self.removeClass('core_registerForm');

    setTimeout(function(){
      self.find('[type="submit"]').eq(0).trigger('click');
    },200);
  }
});


/* ================================================================================================================
 * REGISTER DONE
 */

$(document).find('.core_registerDone').each(function(){
  var self = $(this);

  var data = {
    message: self.data('message'),
    email: self.data('email')
  };

  data.message = data.message.split('[EMAIL]').join(data.email);

  popups.actionAlert(L['REGISTRATION_WAS_SUCCESSFUL'],data.message,'success',function(){
    window.location = '/';
  });
});


/* ================================================================================================================
 * POP UP WINDOW
 */

$(document).find('.core_popUpWindow').each(function(){
  var self = $(this);

  var data = {
    message: self.data('popup-message'),
    delay: self.data('popup-delay') * 1000
  };

  setTimeout(function(){
    popups.actionAlert(L['INFORMATION'],data.message,'info');
  },data.delay);
});


/* ================================================================================================================
 * NEWSLETTER POP UP WINDOW
 */

$(document).find('.core_newsletterPopUpWindow').each(function(){
  var self = $(this);

  var data = {
    message: self.data('newsletter-popup-message'),
    delay: self.data('newsletter-popup-delay') * 1000
  };

  setTimeout(function(){
    popups.newsletter(data.message);
  },data.delay);
});


/* ================================================================================================================
 * NEWSLETTER POP UP WINDOW
 */

$(document).find('.core_newsletterUnsubscribe').each(function(){
  var self = $(this);

  var url = window.location.href + '?json=1';

  popups.yesNo(L['RESIGN_WITH_NEWSLETTER'],L['CONFIRM_REMOVE_NEWSLETTER'],'info',
      function(){
        $.post(url,{
          remove_newsletter_yes: 1
        },function(response){
          response = JSON.parse(response);

          if(response.success == false){
            popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['PLEASE_TRY_AGAIN'],'error');
          }else{
            popups.actionAlert(L['INFORMATION'],L['PDF_THIRD_INFO'],'success',function(){
              window.location = '/';
            });
            setTimeout(function(){
              window.location = '/';
            },5000);
          }
        });
      },function(){
        window.location = '/';
      }
  );
});


/* ================================================================================================================
 * CHANGE EMAIL
 */

$(document).on('submit','.core_changeEmail',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    email: self.find('input[name="user_email"]').val(),
    validate: formValidator(self)
  };
  var url = '/register/emailchange/1/?json=1';

  if(data.validate){
    $.ajax({
      type: 'POST',
      url: url,
      data: {
        user_email: data.email
      },
      dataType: 'json',
      success: function(response){
        if(response.success == true){
          popups.actionAlert(L['EMAIL_WAS_SENT'],response.msg,'success');
        }else{
          if(typeof response.errors === 'object' && response.errors.length > 0){
            response.errors.forEach(function(error){
              popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],error,'error');
            });
          }
        }
      }
    });
  }
});


/* ================================================================================================================
 * CHANGE PASSWORD
 */

$(document).on('submit','.core_changePassword',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    email: self.find('input[name="email"]').val(),
    password: self.find('input[name="password"]').val(),
    validate: formValidator(self)
  };
  var url = '/passrecover/?json=1';

  if(data.validate){
    $.ajax({
      type: 'POST',
      url: url,
      data: {
        email: data.email,
        password: data.password,
        submit: 1
      },
      dataType: 'json',
      success: function(response){
        if(response.success == true){
          popups.actionAlert(L['INFORMATION'],response.msg,'success');
        }else{
          if(typeof response.errors === 'object' && response.errors.length > 0){
            response.errors.forEach(function(error){
              popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],error,'error');
            });
          }
        }
      }
    });
  }
});


/* ================================================================================================================
 * ADD EMAIL TO NEWSLETTER
 */

$(document).on('click','.core_addEmailToNewsletter',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    email: self.parents('form').find('input[name="email"]').val(),
    is_js: self.parents('form').find('.pro-tecting-_-Input').val()

  };
  var url = '/register/?json=1';

  $.post(url,{
    email: data.email,
    is_js: data.is_js
  },function(response){
    response = JSON.parse(response);

    if(response.lang == 'NEWSLTETTER_THANKS'){
      popups.actionAlert(L['INFORMATION'],response.msg,'info');
    }else if(response.lang == 'EMAIL_BUSY' || response.lang == 'WRONG_EMAIL'){
      popups.actionAlert(L['INFORMATION'],response.msg,'error');
    }else{
      if(typeof response.user_error !== 'undefined'){
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.user_error,'error');
      }else{
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.errors.join(' '),'error');
      }
    }
  });
});


/* ================================================================================================================
 * ADD EMAIL TO NEWSLETTER POPUP
 */

$(document).on('submit','.core_addEmailToNewsletterPopup',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    email: self.find('input[name="email"]').val(),
    validate: formValidator(self),
    is_js: self.find('input[name="is_js"]').val()
  };
  var url = '/register/?json=1';

  if(data.validate){
    $.post(url,{
      email: data.email,
      is_js: data.is_js
    },function(response){
      response = JSON.parse(response);

      if(response.lang == 'NEWSLTETTER_THANKS'){
        popups.actionAlert(L['INFORMATION'],response.msg,'info');
      }else if(response.lang == 'EMAIL_BUSY' || response.lang == 'WRONG_EMAIL'){
        popups.actionAlert(L['INFORMATION'],response.msg,'error');
      }else{
        popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],response.user_error,'error');
      }
    });
  }
});


/* ================================================================================================================
 * ACCEPT COOKIES
 */

$(document).on('click','.core_acceptCookies',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    cookiesElement: self.parents('.cookies'),
    accept: 1
  };

  cookies.create('co_accept',data.accept,365 * 24 * 60 * 60 * 1000);

  data.cookiesElement.transition('slideUp',200,function(){
    data.cookiesElement.eq(0).remove();
  });
});


/* ================================================================================================================
 * ADD TICKET
 */

$(document).on('submit','.core_addTicket',function(e){
  e.preventDefault();

  var self = $(this);

  removeAllErrors(self);

  var data = {
    error: self.data('error'),
    errorRequired: self.data('error-required'),
    title: self.find('input[name="title"]').val(),
    email: self.find('input[name="email"]').val(),
    text: self.find('textarea[name="text"]').val(),
    order_id: self.find('input[name="order_id"]').val(),
    is_js: self.find('.pro-tecting-_-Input').val()
  };
  var url = '/ticket/?json=1';

  if(!data.title || !data.email || !data.text){
    if(!data.title){
      addError(self.find('input[name="title"]'),data.errorRequired);
    }
    if(!data.email){
      addError(self.find('input[name="email"]'),data.errorRequired);
    }
    if(!data.text){
      addError(self.find('textarea[name="text"]'),data.errorRequired);
    }

    popups.actionAlert(L['INFORMATION'],data.error,'error');
  }else{
    var postData = {
      title: data.title,
      email: data.email,
      text: data.text,
      submit: 'submit',
      is_js: data.is_js
    }

    if(data.order_id){
      postData['order_id'] = data.order_id;
    }

    $.post(url,postData,function(response){
      try {
        var decodedResponse = JSON.parse(response);
      } catch(e) {
        popups.actionAlert(L['INFORMATION'],L['ERROR_UNEXPECTED_ERROR'],'error');
      }

      if (decodedResponse.type === 'BOT_PROTECT')
      {
        popups.actionAlert(L['INFORMATION'],L['FORM_VALIDATION_FAILED_JS'],'error');
        return;
      }

      window.location = '/ticket/sended';
    });
  }
});


/* ================================================================================================================
 * SHOW DISCOUNT INFO
 */

$(document).on('click','.core_showDiscountInfo',function(e){
  e.preventDefault();

  var self = $(this);

  var data = {
    info: self.data('info')
  };

  popups.actionAlert(L['INFORMATION'],data.info,'info');
});


/* ================================================================================================================
 * NOTIFY AVAILABLE PRODUCT
 */

$(document).on('click','.core_notifyAvailableProduct',function(e){
  var self = $(this);

  var data = {
    value: self.prop('nodeName') == 'INPUT' ? self.val() : self.prev().val(),
    productId: self.data('product-id'),
    success: self.data('success')
  };
  var url = '/product/?json=1&action=available_notify';

  if(data.value == '1'){
    var typeEmail = self.parents('.product-notify-available-product').find('.product-notify-available-product-type-email');

    if(self.prop('checked') == true){
      typeEmail.transition('slideDown',200);
    }else{
      typeEmail.transition('slideUp',200);
    }
  }else{
    $.ajax({
      type: 'POST',
      url: url,
      data: {
        prod_id: data.productId,
        email: data.value
      },
      dataType: 'json',
      success: function(response){
        if(response.success == true){
          data.success = data.success.replace('[[EMAIL]]',' (' + data.value + ')');

          popups.actionAlert(L['EMAIL_WAS_SAVE'],data.success,'success');

          self.parents('.row').eq(0).transition('slideUp',200,function(){
            self.parents('.row').eq(0).remove();
          });
        }else{
          popups.actionAlert(L['ERROR_UNEXPECTED_ERROR'],L['PLEASE_TRY_AGAIN'],'error');
        }
      }
    });
  }
});


/* ================================================================================================================
 * LOGIN HURT TRIGGER LOGIN
 */
$(document).on('click','.core_loginHurtTriggerLogin',function(e){
  e.preventDefault();

  var self = $(this),
      loginHurt = $('.login-hurt');
  loginHurt.find('form').eq(0).find('[type="submit"]').trigger('click');

});


/* ================================================================================================================
 * SCB RATY
 */

$(document).on('click','.core_scbRaty',function(e){
  var self = $(this);

  var data = {
    price: self.data('price'),
    scb: self.data('scb')
  };
  var url = 'https://wniosek.eraty.pl/symulator/oblicz/numerSklepu/' + data.scb + '/typProduktu/0/wartoscTowarow/' + data.price;

  window.open(url,'Policz_rate','width=630,height=500,directories=no,location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no');
});


/* ================================================================================================================
 * COUNT DOWN PROMOTION
 */

$(document).find('.core_countDownPromotion').each(function(){
  var self = $(this);

  var data = {
    countdown: self.data('countdown'),
    pattern: function(data){
      return [
        typeof data.days !== 'undefined' || data.days > 0 ? '<span>' + data.days + '</span>' : '',
        typeof data.days !== 'undefined' || data.days > 0 ? ' ' + L['DAYS'] + ' ' : '',
        '<span>' + data.hours + '</span>',
        ':',
        '<span>' + data.minutes + '</span>',
        ':',
        '<span>' + data.seconds + '</span>'
      ].join('');
    },
    append: function(html){
      self[0].innerHTML = html;
    }
  };

  countdown.setLabels(
      '|z|:|:|x||||||',
      '|z|:|:|x||||||',
      '','',''
  );

  if(data.countdown > 0){
    var countdownTimer = countdown(Big(Date.now()).plus(data.countdown * 1000),function(parse){
      data.append(data.pattern({
        days: parse.days,
        hours: (parse.hours).pad(),
        minutes: (parse.minutes).pad(),
        seconds: (parse.seconds).pad()
      }));

      if(parse.days == 0 && parse.hours == 0 && parse.minutes == 0 && parse.seconds == 0){
        window.clearInterval(countdownTimer);
      }
    },countdown.DAYS|countdown.HOURS|countdown.MINUTES|countdown.SECONDS);
  }else{
    data.append(data.pattern({
      days: 0,
      hours: (0).pad(),
      minutes: (0).pad(),
      seconds: (0).pad()
    }));
  }
});
