(function( $, undefined ) {

$.widget( "ui.tombar", {
	version: "1.10.4",
	options: {
		max: 100,
		value: 0,
		labels:[],

		change: null,
		complete: null
	},

	min: 0,

	_create: function() {
		// Constrain initial value
		this.oldValue = this.options.value = this._constrainedValue();

		this.element
			.addClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
			.attr({
				// Only set static values, aria-valuenow and aria-valuemax are
				// set inside _refreshValue()
				role: "progressbar",
				"aria-valuemin": this.min
			});
		this.labelDivs=[];
		this.labels=[];
		
		this.valueDiv = $( "<div class='tombar-value tombar ui-corner-left'></div>" )
		.appendTo( this.element );
		
		for(var i=0;i<this.options.labels.length;i++){
			this.labelDivs.push($( "<div class='tombar tombar-label-div'></div>" )
				.appendTo( this.element ));
//			this.labels.push($( "<div class='tombar tombar-label'>"+
//					this.options.labels[i].title+
//					"</div>" )
//				.appendTo( this.element ));
			$('#'+this.options.labels[i].title).css('background-color', this.options.labels[i].color);
		}		
		
		
//		this.element.append('<div class="tombar tombar-label-left">'+this.min+'</div>');
//		this.element.append('<div class="tombar tombar-label-right">'+this.options.max.toFixed(2)+'</div><br/>');

		this._refreshValue();
	},

	_destroy: function() {
		this.element
			.removeClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
			.removeAttr( "role" )
			.removeAttr( "aria-valuemin" )
			.removeAttr( "aria-valuemax" )
			.removeAttr( "aria-valuenow" );

		this.valueDiv.remove();
	},

	value: function( newValue ) {
		if ( newValue === undefined ) {
			return this.options.value;
		}

		this.options.value = this._constrainedValue( newValue );
		this._refreshValue();
	},

	_constrainedValue: function( newValue ) {
		if ( newValue === undefined ) {
			newValue = this.options.value;
		}

		this.indeterminate = newValue === false;

		// sanitize value
		if ( typeof newValue !== "number" ) {
			newValue = 0;
		}

		return this.indeterminate ? false :
			Math.min( this.options.max, Math.max( this.min, newValue ) );
	},

	_setOptions: function( options ) {
		// Ensure "value" option is set after other values (like max)
		var value = options.value;
		delete options.value;

		this._super( options );

		this.options.value = this._constrainedValue( value );
		this._refreshValue();
	},

	_setOption: function( key, value ) {
		if ( key === "max" ) {
			// Don't allow a max less than min
			value = Math.max( this.min, value );
		}

		this._super( key, value );
	},

	_percentage: function(val) {
		return this.indeterminate ? 100 : 100 * ( val - this.min ) / ( this.options.max - this.min );
	},

	_refreshValue: function() {
		var value = this.options.value,
			percentage = this._percentage(value);

		for(var i=0;i<this.options.labels.length;i++){
			this.labelDivs[i].css('width',this._percentage(this.options.labels[i].value)+'%');
			this.labelDivs[i].css('border-color', this.options.labels[i].color);
			//this.labels[i].html(this.options.labels[i].value);
			//this.labels[i].css('left',this._percentage(this.options.labels[i].value)+'%');
		}
		
		this.valueDiv.removeClass('low mid high');
		this.valueDiv
			.toggle( this.indeterminate || value > this.min )
			.toggleClass( "ui-corner-right", value === this.options.max )
			.width( percentage.toFixed(0) + "%" )
			.addClass(this.options.graphClass);
		
		this.element.toggleClass( "ui-progressbar-indeterminate", this.indeterminate );

		if ( this.indeterminate ) {
			this.element.removeAttr( "aria-valuenow" );
			if ( !this.overlayDiv ) {
				this.overlayDiv = $( "<div class='ui-progressbar-overlay'></div>" ).appendTo( this.valueDiv );
			}
		} else {
			this.element.attr({
				"aria-valuemax": this.options.max,
				"aria-valuenow": value
			});
			if ( this.overlayDiv ) {
				this.overlayDiv.remove();
				this.overlayDiv = null;
			}
		}

		if ( this.oldValue !== value ) {
			this.oldValue = value;
			this._trigger( "change" );
		}
		if ( value === this.options.max ) {
			this._trigger( "complete" );
		}
	}
});

})( jQuery );