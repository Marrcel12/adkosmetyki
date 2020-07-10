var formValidator = function(scope,selfTest){
  removeAllErrors(scope);

  /* ================================================================================================================
   * FUNCTION FOR TEST RULES - VALUES
   */

  var testRules = function(valid,rules){
    var messages = [];

    rules.forEach(function(rule){
      var ruleName = rule.split(':')[0],
          ruleValue = rule.split(':')[1],
          validNode = valid[0],
          message;

      /* ============================================================================================================
       * RULES TYPES
       */

      switch(ruleName){
        case 'required':
          message = L['ERROR_REQUIRED_FIELD'];

          if(validNode.nodeName == 'INPUT' && (validNode.type == 'checkbox' || validNode.type == 'radio')){
            if(valid.prop('checked') == false){
              messages.push(message);
            }
          }
          if(validNode.nodeName == 'INPUT' && (validNode.type != 'checkbox' && validNode.type != 'radio')){
            if(valid.val() == ''){
              messages.push(message);
            }
          }
          if(validNode.nodeName == 'SELECT' || validNode.nodeName == 'TEXTAREA'){
            if(valid.val() == ''){
              messages.push(message);
            }
          }
        break;
        case 'equal':
          message = L['WRONG_PASSWORD_NOT_SAME'];

          if(valid.parents('form').eq(0).find('[name="' + ruleValue + '"]').val() != valid.val()){
            messages.push(message);
          }
        break;
        case 'email':
          message = L['ERROR_EMAIL_IS_INVALID'];

          if(new RegExp(/^[a-z0-9&\'\.\-_\+]+@[a-z0-9\-]+\.([a-z0-9\-]+\.)*?[a-z]+$/i).test(valid.val().replace(/\s/g,'')) == false){
            messages.push(message);
          }
        break;

        case 'postcode':
          var inputCountry = $(valid.data('valid-parent-postcode'));
          message = L['ERROR_POSTCODE_IS_INVALID'];
          if(new RegExp(/^\d{2}-\d{3}$/).test(valid.val().replace(/\s/g,'')) == false &&
              inputCountry.length > 0 &&
              inputCountry.children("optgroup").children("option:selected").val() == 'PL' ){
            messages.push(message);
          }
        break;

        case 'streetAddressNr':
          message = L['ERROR_STREET_ADDRESS_NR_IS_INVALID'];
          if(new RegExp(/\d/).test(valid.val().replace(/\s/g,'')) == false){
            messages.push(message);
          }
        break;
        case 'phone':
          message = L['ERROR_PHONE_IS_INVALID'];

          var number = valid.val().split('-').join('').split(' ').join(''),
              error = 0,
              count = 0;

          number.split('').forEach(function(test,i){
            if(i == 0 && test == '+'){}else if(!((parseInt(test) ^ 0) === parseInt(test))){
              error++;
            }else{
              count++;
            }
          });

          if(error == 0 && count == 0){}else if(error > 0 || count < 9 || count >= 14){
            messages.push(message);
          }else{
            valid.val(number);
          }
        break;
        case 'taxNumber':
          message = L['ERROR_TAX_NUMBER_IS_INVALID'];

          var number = valid.val().split('-').join('').split(' ').join('');

          var onlyNumbers = number.replace(/[^0-9]+/g, '');

          // if(!/^\d*[0-9]\d*$/.test(number) && number != ''){
          //   messages.push(message);
          //   console.log(message);
          // }else{
          //   //valid.val(number);
          //   console.log('else: ');
          //   console.log(valid.val(number));
          // }

          if (number != '' && onlyNumbers.length > 6) {
            valid.val(number);
          } else {
            messages.push(message);
            SkyShop.debug(function () {
              console.log(message);
            })
          }

        break;
        case 'minlength':
          message = L['ERROR_MIN_CHAR'].split('[CHARS]').join(ruleValue);

          if(validNode.nodeName == 'INPUT' || validNode.nodeName == 'TEXTAREA'){
            if(valid.val().length < ruleValue){
              messages.push(message);
            }
          }
        break;
        case 'maxlength':
          message = L['ERROR_MAX_CHAR'].split('[CHARS]').join(ruleValue);

          if(validNode.nodeName == 'INPUT' || validNode.nodeName == 'TEXTAREA'){
            if(valid.val().length > ruleValue){
              messages.push(message);
            }
          }
        break;

        /* CUSTOM VALID METHODS */

        case 'orderPayment':
          if(valid.find('input[name="payment"]:checked').length == 0){
            messages.push(L['ERROR_SELECT_PAYMENT_METHOD']);
          }
        break;
        case 'orderPaymentBank':
          if(valid.parents('.more').hasClass('open')){
            if(valid.val() == ''){
              messages.push(L['ERROR_SELECT_BANK']);
            }
          }
        break;
        case 'orderShipment':
          if(valid.parents('.order-sections').eq(0).find('#order-deliverys-methods').find('input[name="shipment"]:checked').length == 0){
            messages.push(L['ERROR_SELECT_DELIVERY_METHOD']);
          }
        break;
        case 'orderShipmentSelect':
          if(valid.parents('.more').hasClass('open')){
            if(valid.val() == ''){
              if(typeof valid.data('key') !== 'undefined'){
                messages.push(L['ERROR_SELECT_DELIVERY_CITY']);
              }
              if(typeof valid.data('streets') !== 'undefined'){
                messages.push(L['ERROR_SELECT_DELIVERY_STREET']);
              }
            }
          }
        break;
      };
    });

    return messages;
  };

  /* ================================================================================================================
   * GET ERRORS
   */

  var errors = [],
      errorAdd = function(element,messages){
        errors.push({
          element: typeof element.data('[data-valid-box]') === 'undefined' && element.parents('[data-valid-box]').length == 0 ? element : element.parents('[data-valid-box]').eq(0),
          messages: messages
        });
      },
      valids = typeof selfTest !== 'undefined' && selfTest === true ? scope : scope.find('[data-valid]');

      valids.each(function(){
        var valid = $(this),
            rules = valid.data('valid').split('|'),
            test = testRules(valid,rules),
            parents = valid.data('valid-parent-required'),
            parent,
            parentElement,
            parentMode,
            startTest = true,
            i;

        if (typeof parents === 'string') {
          parents = parents.split(',');

          for (i in parents) {
            parentMode = 0;
            parent = parents[i];

            if (parent[0] === '!') {
              parent = parent.slice(1);
              parentMode = 1;
            }

            parentElement = $('input[data-valid-parent="' + parent + '"]:checked');

            if(parentElement.length === parentMode){
              startTest = false;
            }
          }
        }

        if(startTest && test.length > 0){
          errorAdd(valid,test);
        }
      });

  /* ================================================================================================================
   * RETURN ERRORS TRUE / FALSE
   */

  errors.forEach(function(error){
    addError(error.element,error.messages);
  });

  if(typeof errors[0] !== 'undefined'){
    errors[0].element[0].scrollIntoView();
  }

  return errors.length > 0 ? false : true;
};

/* ================================================================================================================
 * STORAGE DATA IN COOKIES FOR FORM
 */

var formStorageCookieName = function(element,rule){
  var name = rule.split('|')[0],
      nameType = name.split('(')[0],
      nameValue,
      prefix = typeof rule.split('|')[1] !== 'undefined' ? rule.split('|')[1] : '',
      suffix = typeof rule.split('|')[2] !== 'undefined' ? rule.split('|')[2] : '',
      cookieName = null;

  if(typeof name !== 'undefined'){
    switch(nameType){
      case 'attr':
        nameValue = element.attr(name.split('(')[1].split(')')[0]);
        cookieName = prefix + nameValue + suffix;
      break;
      default:
        cookieName = prefix + name + suffix;
      break;
    }
  }

  return cookieName;
};

var formStorage = function(scope,isSelf){
  var selector = scope.find('[data-storage]');

  if(typeof isSelf !== 'undefiend' && isSelf){
    selector = scope;
  }

  selector.each(function(){
    var self = $(this),
        type = self.prop('tagName'),
        cookieName = formStorageCookieName(self,self.data('storage')),
        cookieValue = null;

    switch(type){
      case 'INPUT':
        switch(self.attr('type')){
          case 'checkbox':
          case 'radio':
            if(self.prop('checked') === true){
              cookieValue = self.val();
            }
          break;
          default:
            cookieValue = self.val() != '' ? self.val() : null;
          break;
        }
      break;
      case 'SELECT':
        cookieValue = self.val() != '' ? self.val() : null;
      break;
      case 'TEXTAREA':
        cookieValue = self.val() != '' ? self.val() : null;
      break;
    }

    if(cookieValue == null){
      cookies.erase(cookieName);
    }else{
      cookies.create(cookieName,cookieValue,60 * 24 * 60 * 60 * 1000);
    }
  });
};

var formStorageLoad = function(){
  $(document).find('[data-storage]').each(function(){
    var self = $(this),
        type = self.prop('tagName'),
        cookieName = formStorageCookieName(self,self.data('storage')),
        cookieValue = cookies.read(cookieName);

    if(cookieValue != null){
      switch(type){
        case 'INPUT':
          switch(self.attr('type')){
            case 'checkbox':
            case 'radio':
              setTimeout(function(){
                self.click();
              },10);
            break;
            default:
              self.val(cookieValue);
            break;
          }
        break;
        case 'SELECT':
          self.val(cookieValue).trigger('change');
        break;
        case 'TEXTAREA':
          self.text(cookieValue);
        break;
      }
    }
  });
}();

$(document).on('click blur','[data-storage]',function(e){
  var self = $(this),
      type = self.prop('tagName');

  switch(e.type){
    case 'click':
      switch(type){
        case 'INPUT':
          switch(self.attr('type')){
            case 'checkbox':
            case 'radio':
              formStorage(self,true);
            break;
          }
        break;
      }
    break;
    case 'focusout':
      switch(type){
        case 'INPUT':
          switch(self.attr('type')){
            default:
              formStorage(self,true);
            break;
          }
        break;
        case 'SELECT':
          formStorage(self,true);
        break;
        case 'TEXTAREA':
          formStorage(self,true);
        break;
      }
    break;
  }
});
