headerMenuFormatter(768,[
  'vertical-menu'
]);

addEvent(window,'resize',function(){
  headerMenuFormatter(768,[
    'vertical-menu'
  ]);
});

$('#header.mod-header-6 .carousel.slider-carousel')
  .on('initialized.owl.carousel',function(event){
    $(event.currentTarget).velocity({
      opacity: 1
    },{
      duration: 50
    });
  })
  .owlCarousel({
    loop: $('#header.mod-header-6 .carousel.slider-carousel').children().length > 1,
    margin: 0,
    nav: $('#header.mod-header-6 .carousel.slider-carousel').children().length > 1,
    autoplay: true,
    autoplayTimeout: parseInt($('#header.mod-header-6 .carousel.slider-carousel').data('timeout')),
    autoplayHoverPause: false,
    lazyLoad: true,
    navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    responsive: {
      0: {
        items: 1
      }
    }
  });

$('#header.mod-header-6').find('.vertical-menu').find('ul').eq(0).children('li').on('mouseenter',function(){
  var self = $(this),
      subCategories = self.find('.sub-categories').eq(0),
      subCategoriesContent = subCategories.find('.sub-categories-content').eq(0),
      subCategoriesManipulation = subCategories.find('.row').eq(0),
      topPosition = parseInt(self.position().top + self.outerHeight(true)),
      categoriesHeight = subCategories.outerHeight(true);

  if(topPosition > categoriesHeight){
    subCategoriesContent.css('min-height',parseInt(topPosition + 15) + 'px');
  }
});

$('#open-header-left-menu').on('mouseenter',function(){
  var self = $(this),
      header = self.parents('#header').eq(0),
      leftMenu = header.find('.header-bottom.slide-down');

  if(!leftMenu.hasClass('open')){
    leftMenu.addClass('open');
    leftMenu.one('mouseleave',function(){
      leftMenu.removeClass('open');
    });
  }
});
