$(document).on('click','.heading-blog-list-filters',function(){
    var self = $(this),
        panelType = self.data('panel'),
        panel = self.next().clone();
        var currents = [],
            categories,
            template = {
              container: [
                '<div class="mobile-categories">',
                  '<ul>',
                    '{{:categories:}}',
                  '</ul>',
                '</div>'
              ].join(''),
              list: [
                '<li data-id="{{:id:}}">',
                  '<a href="#{{:url:}}" rel="nofollow">{{:name:}}</a>',
                  '<i class="fa fa-bars open-subtree"></i>',
                '</li>'
              ].join('')
            },
            getCategoriesElements = panel.find('.categories.dropdowns').children('ul'),
            getCategories = function(element){
              return element.children().map(function(){
                var list = $(this).children('a'),
                    children = $(this).children('ul'),
                    item = {
                      id: Math.random().toString(16).slice(2),
                      name: list.attr('title'),
                      url: list.attr('href')
                    };
  
                if(children.length > 0){
                  item.children = getCategories(children);
                }
  
                return item;
              }).get();
            },
            renderMobileCategories = function(list,first){
              var renderList = '',
                  renderContainer = template.container,
                  cloneList = JSON.parse(JSON.stringify(list));
  
              if(typeof first !== 'undefined' && first === true){
                cloneList.unshift('back');
  
                renderContainer = $(renderContainer);
                renderContainer.addClass('fade-in');
                renderContainer = renderContainer.prop('outerHTML');
              }
  
              cloneList.forEach(function(item){
                var render = template.list;
  
                if(item == 'back'){
                  render = render.replace(/{{:id:}}/g,item.id);
                  render = render.replace(/{{:name:}}/g,'Powrót');
                  render = render.replace(/#{{:url:}}/g,'#');
  
                  render = $(render);
  
                  render.addClass('close-subtree');
                  render.removeAttr('data-id');
                  render.find('i').attr('class','fa fa-angle-left')
                }else{
                  render = render.replace(/{{:id:}}/g,item.id);
                  render = render.replace(/{{:name:}}/g,item.name);
                  render = render.replace(/#{{:url:}}/g,item.url);
  
                  render = $(render);
  
                  if(typeof item.children === 'undefined'){
                    render.find('i').remove();
                  }
                }
  
                render = render.prop('outerHTML');
  
                renderList += render;
              });
  
              return $(renderContainer.replace(/{{:categories:}}/g,renderList));
            };
  
        categories = getCategories(getCategoriesElements);
  
        createSwipePanel('left','categories',function(content){
          content.append(renderMobileCategories(categories));
  
          content.on('click.mobileCategoriesOpen','.open-subtree',function(e){
            e.preventDefault();
  
            var self = $(this),
                id = self.parents('li').eq(0).data('id'),
                current = categories,
                currentRender;
  
            currents.push(id);
            currents.forEach(function(single){
              current.forEach(function(item){
                if(item.id == single){
                  current = item.children;
                }
              });
            });
  
            currentRender = renderMobileCategories(current,true)
  
            content.append(currentRender);
            setTimeout(function(){
              currentRender.removeClass('fade-in');
            },100);
          });
  
          content.on('click.mobileCategoriesClose','.close-subtree',function(e){
            e.preventDefault();
  
            var self = $(this),
                subTree = content.find('.mobile-categories').last();
  
            currents.pop();
  
            subTree.addClass('fade-in');
  
            setTimeout(function(){
              subTree.remove();
            },100);
          });
        },function(content){
          content.off('click.mobileCategoriesOpen click.mobileCategoriesClose');
        });

  });
  