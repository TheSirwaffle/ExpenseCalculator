var currentDate;
var currentForm;
var startingDay;
var endingDay;
var monetaryValues = new Array();
var isCtrlDown = false;

window.onload = function() {
	var millis = Date.now();
	var today = new Date(millis);
	fillInCalendar(today);
	var str = "value: { value: 12 } day: { 10 }";
	_getKeyValueFromText("key", str);
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
	var monthAndYear = monthNames[date.getMonth()]+", "+date.getFullYear();
	document.getElementById('monthAndYear').innerHTML = monthAndYear;
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
	if(startingDay != undefined) {
		content += _createElement("startingDay", startingDay.getTime());
	}
	if(endingDay != undefined) {
		content += _createElement("endingDay", endingDay.getTime());
	}
	content += _createElement("startingMoney", document.getElementById("startingMoney").value);
	for(item in monetaryValues) {
		content += _createElement("monetaryValue", monetaryValues[item].toString());
	}
	var e = document.createElement('a');
	e.setAttribute('href', "data:text/plain;charset=UTF-8," + encodeURIComponent(content));
	e.setAttribute('download', "SavedInfo");
	document.body.appendChild(e);
	e.click();
	document.body.removeChild(e);
}

function _createElement(key, element) {
	return key+": {"+element+"} ";
}

function getDateString(date) {
	return date.getMonth()+"/"+date.getDate()+"/"+date.getFullYear();
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
	_calculateTotals();
}

function _selectEndingDay(millis) {
	var date = new Date(millis);
	_fillInDate(date, "endingDate");
	if(endingDay != undefined) {
		_unselectDate(endingDay);
	}
	endingDay = date;
	_fillInCalculationDays();
	_calculateTotals();
}

function _fillInDate(date, id, day) {
	var str = (date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear().toString().substr(2,2);
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

function _calculateTotals() {
	_clearTotals();
	var total = parseInt(document.getElementById("startingMoney").value);
	if(startingDay != undefined && endingDay != undefined) {
		for(m in monetaryValues) {
			var item = monetaryValues[m];
			var calc = item.getMonetaryCalculation();
			if(calc != 0) {
				var str = item.name + " " + calc;
				_addEstimate(str, item.isExpense);
				total += (item.isExpense) ? -calc : calc;
			}
		}
	}
	document.getElementById("total").innerHTML = "$" + total;
}

function _clearTotals() {
	document.getElementById("expenseEstimateList").innerHTML = "";
	document.getElementById("incomeEstimateList").innerHTML = "";
}

function _addEstimate(value, isExpense) {
	var id = (isExpense) ? "expenseEstimateList" : "incomeEstimateList";
	var str = "<li>" + value + "</li>";
	document.getElementById(id).innerHTML += str;
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

function _getDifferenceInMonths() {
	var diff = 0;
	if(startingDay.getFullYear() != endingDay.getFullYear()) {
		var yearDiff = endingDay.getFullYear() - startingDay.getFullYear();
		diff += 12 * (yearDiff - 1);
		diff += 11 - startingDay.getMonth();
		diff += startingDay.getMonth()+1;
	}else {
		diff += endingDay.getMonth() - startingDay.getMonth();
	}
	return diff;
}

function promptFileSelect() {
	document.getElementById("fileSelector").click();
}

function fileSelected() {
	var x = document.getElementById("fileSelector");
	if ('files' in x) {
		for (var i = 0; i < x.files.length; i++) {
			var file = x.files[i];
			var textType = /text.*/;
            if (file.type.match(textType)) {
				var reader = new FileReader();
				reader.onload = function(e) {
					_readInFile(reader.result);
				}
				reader.readAsText(file);
			}else {
				alert("File not supported")
			}
		}
	} 
}

function _readInFile(text) {
	/* if(startingDay != undefined) {
		content += _createElement("startingDay", startingDay.getTime());
	}
	if(endingDay != undefined) {
		content += _createElement("endingDay", endingDay.getTime());
	}
	content += _createElement("startingMoney", document.getElementById("startingMoney").value);
	for(item in monetaryValues) {
		content += _createElement("monetaryValue", monetaryValues[item].toString());
	} */
	
	var str = _getKeyValueFromText("startingDay", text);
	if(str != undefined) {
		_selectStartingDay(parseInt(str));
	}
	str = _getKeyValueFromText("endingDay", text);
	if(str != undefined) {
		_selectEndingDay(parseInt(str));
	}
	str = _getKeyValueFromText("startingMoney", text);
	document.getElementById("startingMoney").value = parseInt(str);
	while((str = _getKeyValueFromText("monetaryValue", text)) != undefined) {
		var monetary = new MonetaryAlteration(true);
		monetary.load(str);
		text = text.replace("monetaryValue: {"+str+"}", "");
	}
	_calculateTotals();
	console.log(text);
}

function _getKeyValueFromText(value, text) {
	value = value+":";
	var n = text.indexOf(value);
	var str = undefined;
	if(n != -1) {
		var str = text.substr(n+value.length, text.length - n - value.length);
		str = str.trim();
		var braceCount = 1;
		for(i = 1; i<str.length && braceCount != 0; i++) {
			var currChar = str.charAt(i);
			if(currChar == "{") {
				braceCount++;
			}else if(currChar == "}") {
				braceCount--;
			}
			if(braceCount == 0) {
				str = str.substr(1, i-1);
			}
		}
		console.log(str);
	}
	return str;
}


/////////   OBJECTS (and useful object functions)     ///////

function MonetaryAlteration(isExpense) {
	this.rates = getRates(isExpense);
	this.isExpense = isExpense;
	this.editingIndex = -1;
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
		this._createInputTag("Amount", "formAmount", "number", "min='1' value='1' step='.01'");
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
	
	this.load = function(text) {
		
	}
	
	this.edit = function() {
		currentForm = this;
		this.createForm();
		var index;
		var combobox = document.getElementById("formComboBox");
		for(i = 0; i<combobox.options.length; i++) {
			if(combobox[i].label === this.selectedRate.name) {
				index = i;
			}
		}
		combobox.selectedIndex = index;
		document.getElementById("formName").value = this.name;
		document.getElementById("formInterval").value = this.interval;
		var day = this.startingDay;
		var dayToString = day.getFullYear()+"-"+this._addZeroToValue(day.getMonth()+1)+"-"+this._addZeroToValue(day.getDate());
		document.getElementById("formStart").value = dayToString;
		document.getElementById("formAmount").value = this.amount;
		this.updateEnabledFields();
		popForm();
	}
	
	this._addZeroToValue = function(value) {
		return (value < 10) ? "0"+value : value;
	}
	
	this.save = function() {
		var selector = document.getElementById("formComboBox");
		var rate = selector.options[selector.selectedIndex].text;
		this.selectedRate = this.rates[rate];
		this.name = document.getElementById("formName").value;
		this.interval = document.getElementById("formInterval").value;
		this.startingDay = this._getActualDate();
		this.amount = document.getElementById("formAmount").value;
		formCancel();
		this.removeFormElements();
		this._addToList();
		_calculateTotals();
	}
	
	this._getActualDate = function() {
		var value = document.getElementById("formStart").value;
		var values = value.split("-");
		var month = values[1] - 1;
		return new Date(values[0], month, values[2]);
	}
	
	this.removeFormElements = function() {
		document.getElementById("addedContent").innerHTML = "";
	}
	
	this._addToList = function() {
		if(this.editingIndex != -1) {
			this._handleSaveEdit();
		}else {
			this.editingIndex = monetaryValues.length;
			var onclickString = "'monetaryValues[" + monetaryValues.length + "].edit()'";
			var str = "<li id='monetaryValue:" + this.editingIndex + "' onclick=" + onclickString + ">"+this._generatePrintedValue()+"</li>";
			var id;
			if(this.isExpense) {
				id = "expenseListItems";
			}else {
				id = "incomeListItems";
			}
			
			monetaryValues.push(this);
			var list = document.getElementById(id);
			list.innerHTML += str;
		}
	}
	
	this._handleSaveEdit = function() {
		var element = document.getElementById("monetaryValue:"+this.editingIndex);
		element.innerHTML = this._generatePrintedValue();
		monetaryValues[this.editingIndex] = this;
	}
	
	this._generatePrintedValue = function() {
		return this.name+"&nbsp;&nbsp;&nbsp;&nbsp;"+this.amount;
	}
	
	this.getMonetaryCalculation = function() {
		var numOccurances = this._getNumberOfOccurances();
		var calc = this.amount * numOccurances;
		if(this.selectedRate.name == "Spread") {
			calc = ((12 * this.amount)/365.0) * numOccurances;
		}
		return calc;
	}
	
	this._getNumberOfOccurances = function() {
		var num = 0;
		var name = this.selectedRate.name;
		var day = this.startingDay;
		if(name == "One Time") {
			num = (day.getTime() >= startingDay.getTime() && day.getTime() <= endingDay.getTime()) ? 1 :0;
		}else if(name == "Monthly") {
			var diff = _getDifferenceInMonths();
			num = this._getOccurancesFromInterval(diff, true);
		}else if(name == "Weekly") {
			var diff = this._getDifferenceInDays(startingDay, endingDay);
			num = this._getOccurancesFromInterval(diff, false);
		}else if(name == "Spread") {
			num = this._getDifferenceInDays(startingDay, endingDay);
		}
		return num;
	}
	
	this._getOccurancesFromInterval = function(diff, isMonth) {
		var occurances = 0;
		if(isMonth) {
			var offset = startingDay.getMonth();
			var mod = Math.abs(this.startingDay.getMonth() - offset) % this.interval ;
			diff -= mod;
			if(diff >= 0) {
				occurances += Math.floor(diff/this.interval);
				if(occurances == 0 && startingDay.getTime() <= this.startingDay.getTime() && endingDay.getTime() >= this.startingDay.getTime()) {
					occurances++;
				}else if(occurances == 0 && mod > 0 && (endingDay.getDate() >= this.startingDay.getDate() || diff/this.interval > occurances)) {
					occurances++;
				}else if(occurances > 0 && (endingDay.getDate() >= this.startingDay.getDate() || diff/this.interval > occurances)) {
					occurances++;
				}
			}
			/*if(diff % this.interval > 0) {
				occurances++;
			}
			if(this.startingDay.getDate() > endingDay.getDate()){
				occurances--;
			}
			if(mod == 0 && startingDay.getDate() > this.startingDay.getDate()) {
				occurances--;
			}*/
		}else {
			var diffInDays = this._getDifferenceInDays(this.startingDay, startingDay); //Get difference in starting days.
			var usesSelectedDay = true;
			if(diffInDays < 0) {
				diffInDays = this._getDifferenceInDays(this.startingDay, endingDay); //Get difference in starting day to ending day.
				usesSelectedDay = false;
				diff = diffInDays;
			}
			if(diffInDays >= 0) {
				var interval = 7 * this.interval;
				if(diffInDays % interval != 0 && usesSelectedDay) {
					var subtract = interval - (diffInDays % interval);
					diff = diff - subtract;
				}
				if(diff >= 0) {
					occurances = Math.floor((diff) / interval);
					if(diff % interval >= 0) {
						occurances++;
					}
				}
			}
		}
		return occurances;
	}
	
	this._getDifferenceInDays = function(firstDate, secondDate) {
		var time1 = firstDate.getTime();
		var time2 = secondDate.getTime();
		var num = 0;
		var diff = time2 - time1;
		num = (diff / (1000 * 60 * 60 * 24));
		return num;
	}
	
	this.toString = function() {
		var isExpense = _createElement("isExpense", this.isExpense);
		var name = _createElement("name", this.name);
		var rate = _createElement("selectedRate", this.selectedRate.name);
		var interval = _createElement("interval", this.interval);
		var startingDay = _createElement("moneyStartingDay", this.startingDay.getTime());
		var amount = _createElement("amount", this.amount);
		return isExpense+name+rate+interval+startingDay+amount;
	}
	
	this.load = function(text) {
		var str = _getKeyValueFromText("isExpense", text);
		this.isExpense = (str === "true");
		this.rates = getRates(this.isExpense);
		str = _getKeyValueFromText("name", text);
		this.name = str;
		str = _getKeyValueFromText("selectedRate", text);
		this.selectedRate = this.rates[str];
		str = _getKeyValueFromText("interval", text);
		this.interval = parseInt(str);
		str = _getKeyValueFromText("moneyStartingDay", text);
		this.startingDay = new Date(parseInt(str));
		str = _getKeyValueFromText("amount", text);
		this.amount = parseInt(str);
		this._addToList();
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