$('.help-icon')
	.on('mouseenter',function(){
		var self = $(this);
				container = self.find('.help-icon-wrapper'),
				parent = container.data('parent'),
				width = container.parents(parent).width(),
				left = container.parents(parent)[0].getClientRects()[0].left - self[0].getClientRects()[0].left;

		container.css({
			width: width,
			left: left,
			display: 'block'
		}).attr('data-left',left + 'px');
		setTimeout(function(){
			container.velocity({
				opacity: 1
			},200);
		},5);
	})
	.on('mouseleave',function(){
		var self = $(this);
				container = self.find('.help-icon-wrapper');

		container.velocity({
			opacity: 0
		},200,function(){
			container.css('display','none');
		});
	});

var toggleGallery = function(action){
	if(typeof action === 'undefined'){
		action = 'close';
	}

	var body = $('html,body'),
			fixedElements = body.children('.fixed-elements'),
			gallery = $('#product-full-gallery'),
			fullProductImg = gallery.find('.carousel.full-product-img'),
			fullProductSlideshow = gallery.find('.carousel.full-product-slideshow'),
			prototypeItem = $('<div class="item"></div>'),
			carousel = productImg,
			slideShow = productSlideshow,
			fullProductFlag = false,
			fullProductDuration = 200;

	if(action == 'open'){
		if(fixedElements.children('#product-full-gallery').length == 0){
			fixedElements.append(gallery.clone());
			gallery.remove();
			gallery = $('#product-full-gallery');
			fullProductImg = gallery.find('.carousel.full-product-img');
			fullProductSlideshow = gallery.find('.carousel.full-product-slideshow');
		}

		var data = {
			title: $('.product-card').find('h1.title').html(),
			startPosition: null,
			images: {},
			smallImages: {}
		};

		$('.zoomWindowContainer').css('visibility','hidden');
		body.addClass('prevent-scroll-desktop');
		gallery.css('display','block');
		gallery.find('.close-shape').one('click',function(){
			toggleGallery('close');
		});
		gallery.find('.product > span').eq(0).html(data.title);
		setTimeout(function(){
			gallery.addClass('open');

			var count = 0;
			carousel.find('.item').each(function(){
				var title = $(this).find('img').eq(0).attr('title');

				if(title == data.title){
					title = false;
				}

				data.images[count] = [typeof $(this).find('img').eq(0).data('src') !== 'undefined' ? $(this).find('img').eq(0).data('src') : $(this).find('img').eq(0).attr('src'),false,title]; count++;
			});
			var count = 0;
			slideShow.find('.item').each(function(){
				var isCurrent = false;
				if($(this).parent().hasClass('current')){
					isCurrent = true;
					data.images[count][1] = isCurrent;
					data.startPosition = count;
				}

				data.smallImages[count] = [typeof $(this).find('img').eq(0).data('src') !== 'undefined' ? $(this).find('img').eq(0).data('src') : $(this).find('img').eq(0).attr('src'),isCurrent]; count++;
			});

			fullProductImg.empty();
			fullProductSlideshow.empty();

			var fullProductSlideshowStyle = {
				width: gallery.find('.menu').height() + 'px',
				height: gallery.find('.menu').width() + 'px'
			}

			fullProductSlideshow.css(fullProductSlideshowStyle);

			for(var i in data.images){
				var item = data.images[i],
						cloneItem = prototypeItem.clone(),
						img = item[0].split('_');
						img.pop();
						img = img.join('_') + '_1200.jpg';

				fullProductImg.append(cloneItem);
				cloneItem.append('<i class="fa fa-refresh fa-spin fa-3x fa-fw"></i><img data-src="' + img + '" class="owl-lazy" data-title="' + item[2] + '" />');
			}
			for(var i in data.smallImages){
				var item = data.smallImages[i],
						cloneItem = prototypeItem.clone();

				fullProductSlideshow.append(cloneItem);
				cloneItem.append('<span><img src="' + item[0] + '" /></span>');
			}

			$(document).on('keydown',function(e){
				switch(e.which){
					case 37: // left
						fullProductImg.find('.owl-prev').trigger('click');
					break;
					case 39: // right
						fullProductImg.find('.owl-next').trigger('click');
					break;
					default: return;
				}
				e.preventDefault();
			});

			fullProductImg
				.on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel',function(event){
					if(!event.namespace){ return; }

					var carousel = event.relatedTarget,
							element = event.target,
							current = carousel.current();

					$('.owl-next',element).toggleClass('disabled',current === carousel.maximum());
					$('.owl-prev',element).toggleClass('disabled',current === carousel.minimum());
				})
				.on('initialized.owl.carousel changed.owl.carousel',function(event,item){
    			var item = $(event.target).find('.owl-item').eq(event.item.index),
							title = item.find('img').data('title');

					if(title != false){
						gallery.find('.product > span').html(title);
					}
				})
				.on('initialized.owl.carousel',function(event){
					if(data.startPosition > 0){
						var firstImg = fullProductImg.find('.item').eq(0).find('img');
								firstImg.attr('src',firstImg.data('src'));
								firstImg.css('opacity',1);
					}
				})
				.owlCarousel({
					items: 1,
					margin: 0,
					nav: true,
					navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
					dots: false,
					lazyLoad: true,
					callbacks: true,
					startPosition: data.startPosition
				})
				.on('changed.owl.carousel',function(event){
	        if(!fullProductFlag){
	          fullProductFlag = true;
						fullProductSlideshow.find('.owl-item.current').removeClass('current');
						fullProductSlideshow.find('.owl-item').eq(event.item.index).addClass('current');
	          fullProductSlideshow.trigger('to.owl.carousel',[event.item.index,fullProductDuration,true]);
	          fullProductFlag = false;
	        }
		    });

			var itemsInRow = Math.floor(fullProductSlideshow.width() / (110 + 20)),
					resizeItems = null,
					reinitFullProductSlideshow = function(){
						fullProductSlideshow.owlCarousel({
							touchDrag: false,
							mouseDrag: false
						});
						fullProductSlideshow.data('owlCarousel').destroy();
						fullProductSlideshow.removeClass('owl-carousel owl-loaded');
						fullProductSlideshow.find('.owl-stage-outer').children().unwrap();
				    fullProductSlideshow.removeData();

						var fullProductSlideshowStyle = {
							width: gallery.find('.menu').height() + 'px',
							height: gallery.find('.menu').width() + 'px'
						}

						fullProductSlideshow.css(fullProductSlideshowStyle);

						itemsInRow = Math.floor(fullProductSlideshow.width() / (110 + 20));

						initFullProductSlideshow();

						fullProductSlideshow.velocity({
							opacity: 1
						},50);
					},
					initFullProductSlideshow = function(){
						fullProductSlideshow
							.on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel',function(event){
								if(!event.namespace){ return; }

								var carousel = event.relatedTarget,
										element = event.target,
										current = carousel.current();

								$('.owl-next',element).toggleClass('disabled',current === carousel.maximum());
								$('.owl-prev',element).toggleClass('disabled',current === carousel.minimum());

								$(window).on('resize.fullWidthGallery',function(){
									if(typeof resizeItems === 'object'){
										fullProductSlideshow.velocity({
											opacity: 0
										},50);
										resizeItems = setTimeout(function(){
											reinitFullProductSlideshow();
											resizeItems = null;
										},250);
									}else{
										clearTimeout(resizeItems);
										resizeItems = setTimeout(function(){
											reinitFullProductSlideshow();
											recalculateSlideshowImages();
											resizeItems = null;
										},250);
									}
								});
							})
							.on('initialized.owl.carousel',function(event){
								fullProductSlideshow.find('.owl-item').eq(data.startPosition).addClass('current');
							})
							.owlCarousel({
								margin: 15,
								items: itemsInRow,
								nav: true,
								navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
								dots: false,
								mouseDrag: false,
								touchDrag: false,
								startPosition: data.startPosition,
								responsive: false
							})
							.on('click','.owl-item',function(){
					      fullProductImg.trigger('to.owl.carousel',[$(this).index(),productDuration,true]);
					    })
					    .on('changed.owl.carousel',function(event){
				        if(!fullProductFlag){
				          fullProductFlag = true;
									fullProductSlideshow.find('.owl-item.current').removeClass('current');
									fullProductSlideshow.find('.owl-item').eq(event.item.index).addClass('current');
				          fullProductImg.trigger('to.owl.carousel',[event.item.index,fullProductDuration,true]);
				          fullProductFlag = false;
				        }
					    });
					},
					recalculateSlideshowImages = function(){
						var preview = gallery.children('.preview'),
								images = preview.find('.item');

								images.each(function(){
									var self = $(this),
											img = self.find('img');

									if(preview.height()/preview.width() > img[0].naturalHeight/img[0].naturalWidth){
										img.removeClass('vertical');
										img.addClass('horizontal');
									}else{
										img.removeClass('horizontal');
										img.addClass('vertical');
									}
								});
					}

			recalculateSlideshowImages();
			initFullProductSlideshow();

		},25);
	}else{
		gallery.removeClass('open');
		setTimeout(function(){
			body.removeClass('prevent-scroll-desktop');
			gallery.css('display','none');
			$(document).off('keydown');
			$(window).off('resize.fullWidthGallery');
			$('.zoomWindowContainer').css('visibility','visible');

			/* Destroy carousel */
			fullProductImg.owlCarousel({
				touchDrag: false,
				mouseDrag: false
			});
			fullProductImg.data('owlCarousel').destroy();
			fullProductImg.removeClass('owl-carousel owl-loaded');
			fullProductImg.find('.owl-stage-outer').children().unwrap();
	    fullProductImg.removeData();

			fullProductSlideshow.owlCarousel({
				touchDrag: false,
				mouseDrag: false
			});
			fullProductSlideshow.data('owlCarousel').destroy();
			fullProductSlideshow.removeClass('owl-carousel owl-loaded');
			fullProductSlideshow.find('.owl-stage-outer').children().unwrap();
	    fullProductSlideshow.removeData();
		},200);
	}
}

var productImg = $('.carousel.product-img'),
		productSlideshow = $('.carousel.product-slideshow'),
		productFlag = false,
		productDuration = 200,
		productElevateZoomSettings = {
			zoomWindowFadeIn: 100,
			zoomWindowFadeOut: 100,
			lensFadeIn: 100,
			lensFadeOut: 100,
			zoomWindowWidth: 400,
			zoomWindowHeight: 400,
			easing: true
		};

		productImg
			.on('initialized.owl.carousel',function(event){
				$(event.currentTarget).velocity({
		      opacity: 1
		    },{
		      duration: 50
		    });

				var element = event.target;

				$('.owl-item.active',element).find('img.mousetrap').ezPlus(productElevateZoomSettings).addClass('elevateZoom-instance');

				$('.product-slideshow').velocity('fadeIn',200);
			})
			.on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel',function(event){
				if(!event.namespace){ return; }

				var carousel = event.relatedTarget,
						element = event.target,
						current = carousel.current();

				$('.owl-next',element).toggleClass('disabled',current === carousel.maximum());
				$('.owl-prev',element).toggleClass('disabled',current === carousel.minimum());
			})
	    .owlCarousel({
        items: 1,
        margin: 0,
        nav: true,
				navText: ['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
        dots: false,
				lazyLoad: true,
				callbacks: true
	    })
	    .on('changed.owl.carousel',function(event){
        if(!productFlag){
          productFlag = true;
					productSlideshow.find('.owl-item.current').removeClass('current');
					productSlideshow.find('.owl-item').eq(event.item.index).addClass('current');
          productSlideshow.trigger('to.owl.carousel',[event.item.index,productDuration,true]);
          productFlag = false;
        }
	    })
			.on('drag.owl.carousel',function(){
				$('.ZoomContainer').css('visibility','hidden');
			})
			.on('dragged.owl.carousel',function(){
				setTimeout(function(){
					$('.ZoomContainer').css('visibility','visible');
				},300);
			})
			.on('translated.owl.carousel',function(event){
				var element = event.target;
				$.removeData($('.elevateZoom-instance'),'elevateZoom');
				$('.elevateZoom-instance').removeClass('elevateZoom-instance');
				$('.ZoomContainer').remove();
				$('.owl-item.active',element).find('img.mousetrap').ezPlus(productElevateZoomSettings).addClass('elevateZoom-instance');
			})
			.on('click','.item',function(){
				if($(window).width() >= 768){
					toggleGallery('open');
				}
			});

		productSlideshow
			.on('initialized.owl.carousel',function(event){
				$(event.currentTarget).velocity({
		      opacity: 1
		    },{
		      duration: 50
		    });

				if(typeof window.fireEvent !== 'undefined'){
					window.fireEvent(new Event('resize'));
				}else{
					window.dispatchEvent(new Event('resize'));
				}
			})
			.on('initialized.owl.carousel changed.owl.carousel refreshed.owl.carousel',function(event){
				productSlideshow.find('.owl-item').eq(0).addClass('current');
			})
	    .owlCarousel({
        margin: 15,
        items: 5,
        nav: false,
        dots: false
	    })
	    .on('click','.owl-item',function(){
	      productImg.trigger('to.owl.carousel',[$(this).index(),productDuration,true]);
	    })
	    .on('changed.owl.carousel',function(event){
        if(!productFlag){
          productFlag = true;
					productSlideshow.find('.owl-item.current').removeClass('current');
					productSlideshow.find('.owl-item').eq(event.item.index).addClass('current');
          productImg.trigger('to.owl.carousel',[event.item.index,productDuration,true]);
          productFlag = false;
        }
	    });
