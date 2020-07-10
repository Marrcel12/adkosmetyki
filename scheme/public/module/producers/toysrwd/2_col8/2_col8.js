$('.carousel.producers-carousel-2')
  .on('initialized.owl.carousel',function(event){
    $(event.currentTarget).velocity({
      opacity: 1
    },{
      duration: 50
    });
  })
  .owlCarousel({
    loop: true,
    margin: 0,
    nav: true,
    dots: false,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    responsive: {
      0: {
        items: 1
      },
      278: {
        items: 2
      },
      407: {
        items: 3
      },
      540: {
        items: 4
      },
      670: {
        items: 5
      },
      800: {
        items: 6
      },
      930: {
        items: 7
      },
      1060: {
        items: 8
      }
    }
  });