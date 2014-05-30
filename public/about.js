$(function(){
	$('.toggler').bind('click', function(event){
		var prefix = $(this).prop('id');
		$('.togglee').hide('blind', 300);
		var selected = $('#'+prefix+'-content');
		if(!selected.is(':visible')){
			selected.show('blind', 300);
		}
	});
	
	$('.togglee').hide();
});