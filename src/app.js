console.log( "ready!" );

$(window).bind('mousewheel DOMMouseScroll', function(event){
    if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
		// scroll up
		GIPP.draggable.dragScale(true);
    }
    else {
		// scroll down
		GIPP.draggable.dragScale(false);
		
    }
});

window.GIPP = {
	scale: {
		top: 0.25
		, side: 0.25
		, muzzle: 0.25
		, bipod: 0.25

		/*
			Arma 3 UI count icon scale relative to in-game Inventory UI, not image itself. 
			This modifier should handle In-game scale to HTML scale (to save in-game scale, but draw icons in HTML properly)
		*/
		, multiplier: 2 
	}
	, proxies: [
		 "top"
		,"side"
		,"muzzle"
		,"bipod"
	]
	, proxiesPaa: [
		 "\\A3\\Weapons_F\\Data\\UI\\attachment_top.paa"
		,"\\A3\\Weapons_F\\Data\\UI\\attachment_side.paa"
		,"\\A3\\Weapons_F\\Data\\UI\\attachment_muzzle.paa"
		,"\\A3\\weapons_f_mark\\data\\UI\\attachment_under.paa"
	]

	, openFile: function (e) {
		let input = event.target;
		let reader = new FileReader();
		reader.onload = function() {
			let dataURL = reader.result;
			let output = document.getElementById('icon-gun');
			output.src = dataURL;
		};

		reader.readAsDataURL(input.files[0]);

		return;
	}
	, updateScale: function (proxy, val) {
		val = Math.round(val * 100) / 100
		this.scale[proxy] = val;
		$("#scale-" + proxy).val(val);
		
		this.scaleIcon(proxy);

		return;
	}
	, scaleIcon: function (proxy) {
		let icon = "#icon-" + proxy;
		let scale = this.scale[proxy] * this.scale.multiplier;
		$(icon).css("transform", "scale(" + scale + ")");

		return;
	}
	, toggleIcons: function (proxy) {
		let icon = "#icon-" + proxy;
		let btn  = "#btn-" + proxy;

		let mode = "none";
		let textPrefix = "+";
		if ($(icon).css("display") === "none") {
			mode = "";
			textPrefix = "-";
		}
		let text = $(btn).text();

		$(icon).css("display", mode);
		$(btn).text( textPrefix + text.substr(1, text.length) )

		return;
	}
	, draggable: {
		  dragPos1: 0
		, dragPos2: 0
		, dragPos3: 0
		, dragPos4: 0
		, dragActiveElement: null

		, initDraggable: function (element) {
			this.dragPos1 = 0;
			this.dragPos2 = 0;
			this.dragPos3 = 0;
			this.dragPos4 = 0;

			$(element).mousedown(GIPP.draggable.dragMouseDown);
		}
		, dragMouseDown: function (e) {
			e = e || window.event;
			e.preventDefault();

			GIPP.draggable.dragActiveElement = this;
			GIPP.draggable.dragPos3 = e.clientX;
			GIPP.draggable.dragPos4 = e.clientY;

			document.onmouseup = GIPP.draggable.dragStop;
			document.onmousemove = GIPP.draggable.dragElement;
		}
		, dragElement: function (e) {
			e = e || window.event;
			e.preventDefault();
			
			// Disable overflow of page 
			$("body").css({"overflow": "hidden"});

			// calculate the new cursor position:
			GIPP.draggable.dragPos1 = GIPP.draggable.dragPos3 - e.clientX;
			GIPP.draggable.dragPos2 = GIPP.draggable.dragPos4 - e.clientY;
			GIPP.draggable.dragPos3 = e.clientX;
			GIPP.draggable.dragPos4 = e.clientY;

			// set the element's new position:
			GIPP.draggable.dragActiveElement.style.top = (GIPP.draggable.dragActiveElement.offsetTop - GIPP.draggable.dragPos2) + "px";
			GIPP.draggable.dragActiveElement.style.left = (GIPP.draggable.dragActiveElement.offsetLeft - GIPP.draggable.dragPos1) + "px";

			GIPP.updateProxyConfigInfo();
		}
		, dragScale: function (increase) {
			if (this.dragActiveElement == null) { return; }
			let proxy = $(this.dragActiveElement).attr("id").substring(5);
			let delta = increase ? 0.01 : -0.01;
			
			GIPP.updateScale(proxy, GIPP.scale[proxy] + delta);
		}
		, dragStop: function () {
			// stop moving when mouse button is released:
			document.onmouseup = null;
			document.onmousemove = null;
			GIPP.draggable.dragActiveElement = null;
			
			// Enable overflow of page 
			$("body").css({"overflow": ""});
		}
	}

	, getProxyPosition: function (proxy) {
		/*
			Calculates position of prxoy:
				- Grab $("#icon-gun").position()   -->> {top: 130, left: 28} and width/height
				- Grab $("#icon-%proxy%").position() -->> {top: 111.83999633789062, left: 144.36000061035156} and width/height
				- Get center of proxy
				- Get delta from Gun Icon top-left to proxy center
				- Divide delta by gun icon width/height
		*/

		let proxyIcon = "#icon-" + proxy;
		let gunIcon = "#icon-gun";

		let proxyPos = $(proxyIcon).position();
		let proxyW = $(proxyIcon).width() * (this.scale[proxy] * this.scale.multiplier);
		let proxyH = $(proxyIcon).height() * (this.scale[proxy] * this.scale.multiplier);
		let proxyCenterX = proxyPos.left + proxyW/2;
		let proxyCenterY = proxyPos.top + proxyH/2;

		let gunPos = $(gunIcon).position();
		let gunW = $(gunIcon).width();
		let gunH = $(gunIcon).height();

		let deltaX = proxyCenterX - gunPos.left;
		let deltaY = proxyCenterY - gunPos.top;

		/*		
		console.log("  POS: " + proxyPos.left + ", "  + proxyPos.top);
		console.log(" CPOS: " + proxyCenterX + ", "  + proxyCenterY);
		console.log(" SIZE: " + proxyW + ", "  + proxyH);
		console.log(" GPOS: " + gunPos.left + ", "  + gunPos.top);
		console.log("CGPOS: " + (gunPos.left + gunW)/2 + ", "  + (gunPos.top + gunH)/2);
		console.log("DELTA: " + deltaX + ", " + deltaY);
		*/

		return [
			 deltaX / gunW
			,deltaY / gunH
		];
	}
	, updateProxyConfigInfo: function () {
		for (let i = 0; i < this.proxies.length; i++) {
			let proxy = this.proxies[i];
			let scale = this.scale[proxy];
			let posInfo = this.getProxyPosition(proxy);

			let posX = Math.round(posInfo[0] * 1000) / 1000;
			let posY = Math.round(posInfo[1] * 1000) / 1000;
			
			let pic = this.proxiesPaa[i];

			let output = '{' +
				'<br />	iconPinpoint="center";' +
				'<br />	iconPosition[] = {' + posX + ',' + posY + '};' + 
				'<br />	iconScale  = ' + scale + ';' + 
				'<br />	iconPicture = "' + pic + '";' + 
				'<br />};'

			$("#output-" + proxy + " > div").html(output);
		}

		return;
	}
	, initEvents: function () {
		$("button[id^='btn-']").on("click", function () {
			GIPP.toggleIcons($(this).attr("mode"));
		});

		$("input[id^='scale-']").on("change", function () {
			GIPP.updateScale($(this).attr("mode"), $(this).val());
		})

		$(".icon-draggable").each(function () {
			GIPP.draggable.initDraggable( this );
		});
		
		return;
	}
	, init: function() {
		for (let i = 0; i < this.proxies.length; i++) {
			let proxy = this.proxies[i];

			this.toggleIcons(proxy);
			this.scaleIcon(proxy);
		}

		this.initEvents();
		this.updateProxyConfigInfo();
	}
};

$( document ).ready(function() {
	console.log( "ready!" );

	GIPP.init();
});