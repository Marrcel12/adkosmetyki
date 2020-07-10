$('.carousel.producers-carousel-1')
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
      357: {
        items: 2
      },
      530: {
        items: 3
      },
      700: {
        items: 4
      },
      870: {
        items: 5
      },
      1040: {
        items: 6
      }
    }
  });