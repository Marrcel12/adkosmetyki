$('.slider.mod-slider-3 .carousel.slider-carousel')
  .on('initialized.owl.carousel',function(event){
    $(event.currentTarget).velocity({
      opacity: 1
    },{
      duration: 50
    });
  })
  .owlCarousel({
    loop: $('.slider.mod-slider-3 .carousel.slider-carousel').children().length > 1,
    margin: 0,
    nav: $('.slider.mod-slider-3 .carousel.slider-carousel').children().length > 1,
    autoplay: true,
    autoplayTimeout: parseInt($('.slider.mod-slider-3 .carousel.slider-carousel').data('timeout')),
    autoplayHoverPause: false,
    lazyLoad: true,
    navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    responsive: {
      0: {
        items: 1
      }
    }
  });
