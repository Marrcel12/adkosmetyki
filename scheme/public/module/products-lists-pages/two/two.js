initializeSelect2($('.products-list-page').find('.parameters').find('.select-field-select2'),{
  closeOnSelect: false,
  selectLang: L['FILTER'],
  selectCallback: function(select){
    select.select.select2('close');
    select.select2.parents('form').submit();
  }
});

$(document).find('.core_chooseSearchPrice').on('select2:unselecting',function(){
  $(this).data('state','unselected');
}).on('select2:open',function(){
  var self = $(this),
      dropdown = $('.select2-results').find('.select2-results__options');

  var data = {
    from: typeof self.data('from') !== 'undefined' && self.data('from') != '' ? self.data('from') : '',
    to: typeof self.data('to') !== 'undefined' && self.data('to') != '' ? self.data('to') : ''
  };

  if(self.data('state') === 'unselected'){
    data = {
      from: '',
      to: ''
    };
  }

  dropdown.html([
    '<div class="range-field">',
      '<div class="container-fluid">',
        '<div class="row">',
          '<div class="col-xs-6">',
            '<input class="input-field" name="from" data-type="min" type="text" value="' + data.from + '" placeholder="' + L['PRICE_FROM'] + '" />',
          '</div>',
          '<div class="col-xs-6">',
            '<input class="input-field" name="to" data-type="max" type="text" value="' + data.to + '" placeholder="' + L['PRICE_TO'] + '" />',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join(''));
}).on('select2:closing',function(){
  var self = $(this),
      dropdown = $('.select2-results').find('.select2-results__options');

  var data = {
    from: dropdown.find('input[name="from"]').val(),
    to: dropdown.find('input[name="to"]').val(),
    string: ''
  }

  if(data.from == '' && data.to == ''){

  }else if(data.from != '' && data.to == ''){
    data.string = L['PRICE_FROM'] + ' ' + stringPricesFormatter(data.from);
  }else if(data.from == '' && data.to != ''){
    data.string = L['PRICE_TO'] + ' ' + stringPricesFormatter(data.to);
  }else{
    data.string = stringPricesFormatter(data.from) + ' - ' + stringPricesFormatter(data.to);
  }

  if(data.string != ''){
    self.append('<option value="1" selected="selected">' + data.string + '</option>');
    pricesFormatter(self.next());
  }else{
    self.select2('val','');
  }
}).append(function(){
  var self = $(this);

  var data = {
    from: typeof self.data('from') !== 'undefined' && self.data('from') != '' ? self.data('from') : '',
    to: typeof self.data('to') !== 'undefined' && self.data('to') != '' ? self.data('to') : '',
    string: ''
  };

  if(data.from == '' && data.to == ''){
    return false;
  }else if(data.from != '' && data.to == ''){
    data.string = L['PRICE_FROM'] + ' ' + stringPricesFormatter(data.from);
  }else if(data.from == '' && data.to != ''){
    data.string = L['PRICE_TO'] + ' ' + stringPricesFormatter(data.to);
  }else{
    data.string = stringPricesFormatter(data.from) + ' - ' + stringPricesFormatter(data.to);
  }

  return '<option value="1" selected="selected">' + data.string + '</option>';
});
