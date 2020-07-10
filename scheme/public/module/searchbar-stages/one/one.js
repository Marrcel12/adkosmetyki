var TEMP_inputsAmount = 3; // poki co zostaje 3, kiedys w przyszlosci byc moze powstanie opcja w kreatorze, ktora pozowli na generowanie wiekszej ilosci inputow
var $selectsParent = $('#searchbar-stages-wrapper');
var isInitialCatSet = parseInt($selectsParent.attr('data-root-cat-search'));
var initialCatId;
if(isInitialCatSet){
    initialCatId = null;
}else{
    initialCatId = parseInt($selectsParent.attr('data-start-category')); // kategoria ktora docelowo ma wybrac klient
}
// funkcja ktora pobiera i zwraca drzewo kategorii
// jako parametr przyjmuje ID kategorii
function getCategoryTree(id, isLast){
    return $.ajax({
        type: 'POST',
        url: '/search/action/getCategoryChildren?json=1',
        data: {
            parentId: id,
            attachChildrenRedirectLink: isLast
        },
        dataType: 'json',
    })
}
var $firstSelect = $('#searchbar_stages_1');

var initialTree; // drzewo kategorii dla pierwszego inputa
initializeSelect2($('.searchbar_stages_select'));
$('.searchbar_stages_inner_wrapper').removeClass('hidden');
// Przypisanie drzewa po asynchronicznym wykonaniu funkcji
function setCategories(catId, select, attachChildrenRedirectLink){
    $.when(getCategoryTree(catId, attachChildrenRedirectLink)).done(function(response){
        initialTree = response.data;
        // kazda opcje z drzewka przerabia na element domu z potrzebnymi atrybutami i appenduje do nowego selecta
        for (var i = 0; i < initialTree.length; i++) {
            var redirectLink;
            var currCat = initialTree[i]
            if(currCat.redirectLink){
                redirectLink = currCat.redirectLink;
            }else{
                redirectLink = null
            }
            var opt = '<option data-cat-id="' + currCat.cat_id +
                '" data-cat-parent-id="' + currCat.cat_parent_id +
                '" data-cat-name="' + currCat.cat_name +
                '" data-redirect-link="' + redirectLink + '">'
                + currCat.cat_name +
                '</option>'
            $(select).append('<option>').append(opt)
        }
    })
}
setCategories(initialCatId, $firstSelect, false);
$firstSelect.removeAttr('disabled');

function loadNewCategories(index, catId){
    var attachChildrenRedirectLink = false;
    // jesli dojdziemy do ostatniego selecta, to wysylamy info o tym, ze backend obowiazkowo musi podac redirectLink
    if(parseInt(index) === parseInt(TEMP_inputsAmount) - 1){
        attachChildrenRedirectLink = true;
    }
    // zwieksza index o 1 zeby "dostac sie" do nastepnego selecta
    var nextIndex = parseInt(index) + 1;
    // znajduje nastepny select
    var $nextSelect = $selectsParent.find('#searchbar_stages_' + nextIndex);
    // usuwa mu disabled i wykonuje zapytanie o nowe drzewko kategorii
    $nextSelect.removeAttr('disabled');
    setCategories(catId, $nextSelect, attachChildrenRedirectLink)
}

function redirectToCategory(link){
    var locationOrigin = window.location.origin;
    if(link){
        window.location.replace(locationOrigin + link);
    }
}

$('.searchbar_stages_select').on('change', function(){
    var self = $(this)[0];
    var parentIndex = $(this)[0].dataset.index;
    var index = self.selectedIndex;
    var selectedOption = $(self.options[index]);
    var redirectLink = selectedOption.attr('data-redirect-link');
    var selectIndex = selectedOption.parent().attr('data-index');
    var catId = selectedOption.attr('data-cat-id');
    // po evencie "change", bierze wszystkie następne inputy i resetuje ich zawartosc oraz dodaje atrybut disabled
    for(i = parentIndex; i < TEMP_inputsAmount; i++){
        var newIndex = parseInt(i) + 1;
        $selectsParent.find('#searchbar_stages_' + newIndex).html('').attr('disabled', true)
    }
    // jesli wybrana opcja nie ma linku, to wykonuje request po nowe kategorie (loadNewCategories())
    // jesli wybrana opcja ma link to wykonuje przekierowanie do podstrony z kategoriami (redirectToCategory())
    if(redirectLink == 'null'){
        loadNewCategories(selectIndex, catId);
    }else{
        redirectToCategory(redirectLink);
    }
});
