$('.account-table').find('[data-href]').on('click',function(){
	window.location = $(this).data('href');
});

if(window.location.pathname.split('/').pop() == 'sended'){
	popups.actionAlert(L['INFORMATION'],$('[data-msg-success]').data('msg-success'),'success');
}
