carousels.productsSliderCarousel1 = function(){
  var carousels = $('.carousel.products-slider-carousel-1:not(.tab-hidden)'),
      timeout = typeof carousels.data('timeout') !== 'undefined' ? carousels.data('timeout') : false,
      isTimeout = timeout === false ? false : true;

  carousels
    .on('initialized.owl.carousel',function(event){
      $(event.currentTarget).velocity({
        opacity: 1
      },{
        duration: 50
      });
    })
    .on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel',function(event){
      if(!event.namespace){ return; }

      var carousel = event.relatedTarget,
          element = event.target,
          current = carousel.current();

      if(!isTimeout){
        $('.owl-next',element).toggleClass('disabled',current === carousel.maximum() || carousel.maximum() === -1);
        $('.owl-prev',element).toggleClass('disabled',current === carousel.minimum());
      }
    })
    .owlCarousel({
      loop: isTimeout,
      margin: 30,
      nav: true,
      dots: false,
      autoplay: isTimeout,
      autoplayTimeout: timeout,
      autoplayHoverPause: true,
      navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
      responsive: {
        0: {
          items: 1
        },
        481: {
          items: 2
        },
        768: {
          items: 3
        },
        1200: {
          items: 4
        }
      }
    });
}

carousels.productsSliderCarousel1();
