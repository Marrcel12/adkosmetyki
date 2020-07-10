$('.registration-country').select2({
  theme: 'bootstrap',
  width: '100%'
}).on('select2:open',function(){
  $('.select2-results > ul').scrollbar();
}).on('select2:closing',function(){
  $('.select2-results > ul').scrollbar('destroy');
});
