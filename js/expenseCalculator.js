var currentDate;
var currentForm;
var startingDay;
var endingDay;
var expenses = new Array();
var isCtrlDown = false;

window.onload = function() {
	var millis = Date.now();
	var today = new Date(millis);
	fillInCalendar(today);
}

function getNumberOfDays(year, month) {
	return new Date(year, month, 0).getDate();
}

function getNumberOfDaysInMonth(date) {
	return getNumberOfDays(date.getFullYear(), date.getMonth()+1);
}

function fillInCalendar(date) {
	clearCalendar();
	currentDate = date;
	var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
	var dayOfWeek = firstDay.getDay();
	var numDays = getNumberOfDays(firstDay.getFullYear(), firstDay.getMonth()+1);
	for(var i=0; i<numDays; i++) {
		var id = "day"+(i+dayOfWeek);
		var currentDay = new Date(date.getFullYear(), date.getMonth(), i+1);
		var millis = currentDay.getTime();
		var extraInfo = "id='"+millis+"' onclick='selectDate("+millis+")'";
		document.getElementById(id).innerHTML = "<span class='populated-day' "+extraInfo+" >"+(i+1)+"</span>";
	}
	_fillInStartingAndEndingDays(firstDay);
	_fillInCalculationDays();
	document.getElementById('month').innerHTML = monthNames[date.getMonth()];
	document.getElementById('year').innerHTML = date.getFullYear();
}

function _fillInStartingAndEndingDays(firstDay) {
	if(startingDay != undefined) {
		_addAsPopulatedDayIfShould(firstDay, startingDay);
		if(endingDay != undefined) {
			_addAsPopulatedDayIfShould(firstDay, endingDay);
		}
	}
}

function _areDatesWithinSameMonth(firstDate, secondDate) {
	return (firstDate.getFullYear() == secondDate.getFullYear() && firstDate.getMonth() == secondDate.getMonth());
}

function _addAsPopulatedDayIfShould(firstDay, populatedDay) {
	if(_areDatesWithinSameMonth(firstDay, populatedDay)) {
		document.getElementById(""+populatedDay.getTime()).className += " selected-day";
	}
}

function clearCalendar() {
	for(var i=0; i<42; i++) {
		var id = "day"+i;
		document.getElementById(id).innerHTML = "";
	}
}

function getMonthAndYear(isNext) {
	var year = currentDate.getFullYear();
	var month = currentDate.getMonth();
	if(isNext) {
		if(month == 11) {
			year++;
			month = 0;
		}else {
			month++;
		}
	}else {
		if(month == 0) {
			year--;
			month = 11;
		}else {
			month--;
		}
	}
	return {
		"year":year,
		"month":month
	};
}

function arrowClicked(isNext) {
	var yearAndMonth = getMonthAndYear(isNext);
	var newDate = new Date(yearAndMonth["year"], yearAndMonth["month"], 1);
	fillInCalendar(newDate);
}

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function addAnExpense() {
	currentForm = new MonetaryAlteration(true);
	currentForm.createForm();
	popForm();
}

function addAnIncome() {
	currentForm = new MonetaryAlteration(false);
	currentForm.createForm();
	popForm();
}

function popForm() {
	var form = document.getElementById("form");
	form.style.display = "block";
}

function formCancel() {
	currentForm.removeFormElements();
	var form = document.getElementById("form");
	form.style.display = "none";
}

function savePage() {
	var content = "";
	for(expense in expenses) {
		content += expense.toString();
	}
	var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
	//var newWindow = window.open(uriContent, 'TestDocument');
}

function selectDate(millis) {
	if(startingDay == undefined || isCtrlDown) {
		_selectStartingDay(millis);
	}else if(startingDay.getTime() < millis){
		_selectEndingDay(millis);
	}
	_fillInCalculationDays();
}

function _selectStartingDay(millis) {
	var date = new Date(millis);
	_fillInDate(date, "startingDate");
	if(startingDay != undefined) {
		_unselectDate(startingDay);
	}
	startingDay = date;
	if(endingDay != undefined && endingDay.getTime() < startingDay.getTime()) {
		_unselectDate(endingDay);
		document.getElementById("endingDate").innerHTML = "";
	}
}

function _selectEndingDay(millis) {
	var date = new Date(millis);
	_fillInDate(date, "endingDate");
	if(endingDay != undefined) {
		_unselectDate(endingDay);
	}
	endingDay = date;
	_fillInCalculationDays();
}

function _fillInDate(date, id, day) {
	var str = (date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear().toString().substr(2,2);;
	document.getElementById(id).innerHTML = str;
	_selectDate(date);
}

function _selectDate(date) {
	document.getElementById(""+date.getTime()).className += " selected-day";
}

function _unselectDate(date) {
	var day = document.getElementById(""+date.getTime());
	if(day != undefined) {
		day.className = "populated-day";
	}
}

function _fillInCalculationDays() {
	_clearOutCalculatedDays();
	if(startingDay != undefined && endingDay != undefined) {
		var numDays = -1;
		var start = -1;
		if(_areDatesWithinSameMonth(startingDay, currentDate)) {
			//Case where the starting date is in the currently selected month.
			start = startingDay.getDate();
			numDays = (_areDatesWithinSameMonth(startingDay, endingDay)) ? endingDay.getDate() - startingDay.getDate() - 1 : getNumberOfDaysInMonth(currentDate) - startingDay.getDate();
		}else if(currentDate.getTime() > startingDay.getTime() && currentDate.getTime() < endingDay.getTime()) {
			//Case where the starting date is before the currently selected month and the ending date is either in the month or after it.
			start = 0;
			numDays = (_areDatesWithinSameMonth(currentDate, endingDay)) ? endingDay.getDate() - currentDate.getDate(): getNumberOfDaysInMonth(currentDate);
		}
		for(i = 0; i<numDays; i++) {
			var date =  new Date(currentDate.getFullYear(), currentDate.getMonth(), i+1+start);
			var e = document.getElementById(""+(date.getTime()));
			e.className += " calculated-day";
		}
	}
}

function _clearOutCalculatedDays() {
	var elements = document.getElementsByClassName("populated-day");
	for(e in elements) {
		var classname = elements[e].className;
		if(classname != undefined) {
			classname = classname.replace("calculated-day", "");
		}
		elements[e].className = classname;
	}
}

function keyDown(event) {
	if(_isCtrlKey(event)) {
		isCtrlDown = true;
	}
}

function keyUp(event) {
	if(_isCtrlKey(event)) {
		isCtrlDown = false;
	}
}

function _isCtrlKey(event) {
	return (event.code == "ControlRight" || event.code == "ControlLeft");
}



/////////   OBJECTS (and useful object functions)     ///////

function MonetaryAlteration(isExpense) {
	this.rates = getRates(isExpense);
	this.isExpense = isExpense;
	this.selectedRate = "";
	this.interval = -1;
	this.startingDay = new Date(-1);
	this.amount = 0;
	
	this.createForm = function() {
		this._createNameEntry();
		this._createComboBox();
		this._createIntervalEntry();
		this._createStartingDayEntry();
		this._createAmountEntry();
		this._updateTitle();
		this.updateEnabledFields();
	}
	
	this._createNameEntry = function() {
		this._createInputTag("Name", "formName", "text");
	}
	
	this._createComboBox = function() {
		var selector = "<select id='formComboBox' onchange='currentForm.updateEnabledFields()'>";
		for(i in this.rates) {
			var obj = this.rates[i];
			selector += "<option>"+obj.name+"</option>";
		}
		selector += "</select>";
		this.addToForm(selector);
	}
	
	this._createIntervalEntry = function() {
		this._createInputTag("Interval", "formInterval", "number", "min='1' max='12' value='1'");
	}
	
	this._createStartingDayEntry = function() {
		this._createInputTag("Starting Day", "formStart", "date");
	}
	
	this._createAmountEntry = function() {
		this._createInputTag("Amount", "formAmount", "number", "min='1' value='1'");
	}
	
	this._updateTitle = function() {
		var title = document.getElementById("formTitle");
		var str = (this.isExpense) ? "Expense" : "Income";
		title.innerHTML = "Add an "+str;
	}
	
	this._createInputTag = function(name, id, type, additionalInfo) {
		var str = "<p>"+name+"</p><input id='"+id+"' type='"+type+"' "+additionalInfo+">";
		this.addToForm(str);
	}
	
	this.addToForm = function(str) {
		var form = document.getElementById("addedContent");
		form.innerHTML += str;
	}
	
	this.updateEnabledFields = function() {
		var selector = document.getElementById("formComboBox");
		var rate = selector.options[selector.selectedIndex].text;
		var theRate = this.rates[rate];
		if(theRate != undefined) {
			document.getElementById('formInterval').disabled = !theRate.hasInternal;
			document.getElementById('formStart').disabled = !theRate.hasSelectedDay;
		}
	}
	
	this.save = function() {
		var selector = document.getElementById("formComboBox");
		var rate = selector.options[selector.selectedIndex].text;
		this.selectedRate = this.rates[rate];
		this.name = document.getElementById("formName").value;
		this.interval = document.getElementById("formInterval").value;
		this.startingDay = document.getElementById("formStart").value;
		this.amount = document.getElementById("formAmount").value;
		formCancel();
		this.removeFormElements();
		this._addToList();
		savePage();
	}
	
	this.removeFormElements = function() {
		document.getElementById("addedContent").innerHTML = "";
	}
	
	this._addToList = function() {
		var str = "<li>"+this.name+"&nbsp;&nbsp;&nbsp;&nbsp;"+this.amount+"</li>";
		var id;
		if(this.isExpense) {
			id = "expenseListItems";
			expenses.push(this);
		}else {
			id = "incomeListItems";
		}
		var list = document.getElementById(id);
		list.innerHTML += str;
	}
	
	this.toString = function() {
		return ""+this.name+" "+this.selectedRate.name+" "+this.interval+" "+this.startingDay+" "+this.amount;
	}
}

function getRates(isExpense) {
	var rates = {"One Time":new Rate("One Time", false, true)};
	rates["Monthly"] = new Rate("Monthly", true, true);
	rates["Weekly"] = new Rate("Weekly", true, true);
	if(isExpense) {
		rates["Spread"] = new Rate("Spread", false, false);
	}
	return rates;
}

function Rate(name, hasInterval, hasSelectedDay) {
	this.name = name;
	this.hasInternal = hasInterval;
	this.hasSelectedDay = hasSelectedDay;
}