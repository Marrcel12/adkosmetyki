(function(){
  var rwdImagesWait = null;
  var rwdImages = function(){
    var images = [].slice.call(document.querySelectorAll('[data-rwd]')),
        clientWidth = window.innerWidth;

    for(var i in images){
      var image = images[i],
          conditions = image.getAttribute('data-rwd').split(','),
          src = image.getAttribute('src').split('_');
          src.pop();
          src = src.join('_') + '_';

      for(var c in conditions){
        var condition = conditions[c].split(':'),
            data = {
              width: parseFloat(condition[0]),
              widthNext: typeof conditions[parseFloat(c) + 1] !== 'undefined' ? parseFloat(conditions[parseFloat(c) + 1].split(':')[0]) : void 0,
              size: parseFloat(condition[1])
            };

        if(clientWidth >= data.width && (clientWidth < data.widthNext || data.widthNext === void 0)){
          image.setAttribute('src',src + data.size + '.jpg');

          break;
        }
      }
    }
  };

  rwdImages();
  window.addEventListener('resize',function(){
    if(typeof rwdImagesWait === 'number'){
      clearTimeout(rwdImagesWait);
    }

    rwdImagesWait = setTimeout(function(){
      rwdImagesWait = null;

      rwdImages();
    },100);
  },true);
})();
