$('.order-country').select2({
  theme: 'bootstrap',
  width: '100%',
  minimumResultsForSearch: -1,
  escapeMarkup: function(markup){
    return markup;
  },
  templateSelection: function(result){
    if(typeof result.id === 'undefined'){
      return result.text;
    }

    return [
      '<div class="order-country-item">',
        '<div class="order-country-item-logo">',
          '<img src="/view/new/img/ico_flags/' + result.id.toLowerCase() + '.png" />',
        '</div>',
        '<div class="order-country-item-name">',
          '<div class="order-country-item-name-wrapper">',
            '<span>' + result.text + '</span>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  },
  templateResult: function(result){
    if(typeof result.id === 'undefined'){
      return result.text;
    }

    return [
      '<div class="order-country-item">',
        '<div class="order-country-item-logo">',
          '<img src="/view/new/img/ico_flags/' + result.id.toLowerCase() + '.png" />',
        '</div>',
        '<div class="order-country-item-name">',
          '<div class="order-country-item-name-wrapper">',
            '<span>' + result.text + '</span>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }
}).on('select2:open',function(){
  $('.select2-results > ul').scrollbar();

  // var waitForResults = setInterval(function(){
  //   if($('.select2-results').find('.select2-results__options').length > 0){
  //     clearInterval(waitForResults);
  //
  //     $('.select2-results').find('.select2-results__options').find('.select2-results__option[role="treeitem"]').each(function(){
  //       var item = $(this),
  //           img = item.find('img[data-src]'),
  //           src, flag;
  //
  //       if(img.length > 0){
  //         src = img.data('src');
  //
  //         flag = new Image();
  //         flag.onload = function(){
  //           img.attr('src',src);
  //           img.removeAttr('data-src');
  //         };
  //         flag.onerror = function(){
  //           window.flags = window.flags || [];
  //           window.flags.push(src);
  //           img.removeAttr('data-src');
  //         };
  //         flag.src = src;
  //       }
  //     });
  //   }
  // },33);
}).on('select2:closing',function(){
  $('.select2-results > ul').scrollbar('destroy');
});

if($("input[name='dotpay_rules_agreed']")){
  var dotpayCheckboxes = $("input[name='dotpay_rules_agreed']").closest('.col-xs-12');
  dotpayCheckboxes.remove();
}
$('.order-select-table').on('click','tr:not(.more) > td',function(e){
  var self = $(this).parents('tr'),
      more = self.next(),
      parents = self.parents('table'),
      actives = parents.find('tr.active'),
      mores = parents.find('tr.more.open'),
      checkbox = self.find('input[type="checkbox"],input[type="radio"]');
    
  var paymentId =  $(this).parents('tr').data('payment-id'),
      orderCheckboxes = $("input[name='register_must_accept']").closest('.col-xs-12');

  if($(this).parent().hasClass('core_getOrderShipments')){      
    if(paymentId == 10){
      orderCheckboxes.after(dotpayCheckboxes);
    }else{
      if(dotpayCheckboxes != undefined ){
        dotpayCheckboxes.remove();
      }
    }
  }

  if(!self.hasClass('active')){
    actives.removeClass('active');
    mores.removeClass('open');
    mores.velocity('fadeOut',{
      duration: 200
    });
    actives.find('input[type="checkbox"],input[type="radio"]').prop('checked',false);
    self.addClass('active');
    checkbox.prop('checked',true);
    if(more.hasClass('more')){
      more.addClass('open');
      more.velocity('fadeIn',{
        duration: 200
      });
    }
  }else{
    e.stopPropagation();
  }
});

$('#param-vat').on('change',function(){
  var self = $(this),
      container = $('.param-vat-container');

  if(self.prop('checked')){
    container.velocity('slideDown',{ duration: 200 });
  }else{
    container.velocity('slideUp',{ duration: 200 });
  }
});

$('#param-account').on('change',function(){
  var self = $(this),
      container = $('.param-account-container');

  if(self.prop('checked')){
    container.velocity('slideDown',{ duration: 200 });
  }else{
    container.velocity('slideUp',{ duration: 200 });
  }
});

$('#bill-vat-exists').on('change', function() {
  var billVatField = $('#user-bill-vat');

  if ($(this).prop('checked')) {
    billVatField.prop('disabled', true);
    removeError(billVatField);
    billVatField.val('');
  } else
    billVatField.prop('disabled', false);
});

