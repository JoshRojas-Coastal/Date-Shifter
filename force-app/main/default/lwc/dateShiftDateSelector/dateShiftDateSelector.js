import { LightningElement, wire, track } from "lwc";
import getOrgObjectList from "@salesforce/apex/DemoDateShifter.getOrgObjectList";
import getDateTimeFields from "@salesforce/apex/DemoDateShifter.getDateTimeFields";
import getMinutesToShift from "@salesforce/apex/DemoDateShifter.getMinutesToShift";

export default class DateSelector extends LightningElement {
	@track orgObjectList = [];
	objectApiName = "";

	@track fieldList = [];
	fieldApiName = "";
	fieldSelectorDisabled = true;

	dateOfDemo = new Date(Date.now()).toISOString();
	dateOfDemoSelected = false;
	mostRecent = "";

	loading = true;

	returnedMinutes = 0;
	minutesToShift = 0;
	daysToShift = 0;
	forBack = "";
	shiftAmountVisible = false;

	error;

	@wire(getOrgObjectList)
	wired_getOrgObjectList({ error, data }) {
		this.orgObjectList = [];
		if (data) {
			this.orgObjectList = [];
			data.forEach((object) => {
				this.orgObjectList.push({
					value: object.apiName,
					label: object.label
				});
			});
			this.orgObjectList.sort((a, b) => (a.label > b.label ? 1 : -1));
			this.orgObjectList.unshift({
				value: "",
				label: "Select an object"
			});
			this.loading = false;
			this.fieldSelectorDisabled = true;
			this.fieldApiName = "";
		} else if (error) {
			this.error = error;
		}
	}

	@wire(getDateTimeFields, { objectApiName: "$objectApiName" })
	wired_getFieldList({ error, data }) {
		this.fieldList = [];
		if (data) {
			data.forEach((field) => {
				this.fieldList.push({
					value: field.apiName,
					label: field.label
				});
			});
			this.fieldList.sort((a, b) => (a.label > b.label ? 1 : -1));
			this.fieldList.unshift({
				value: "",
				label: "Select a field"
			});
		} else if (error) {
			this.error = error;
		}
	}

	handleObjectChange(event) {
		this.objectApiName = event.target.value;
		this.fieldApiName = "";
		this.fieldSelectorDisabled = this.objectApiName === "";
		this.shiftAmountVisible = false;
		this.notifyParent(false);
	}

	handleFieldChange(event) {
		this.fieldApiName = event.target.value;
		this.calculateShift();
	}

	handleDateChange(event) {
		this.dateOfDemo = event.target.value;
		this.dateOfDemoSelected = true;
		this.calculateShift();
	}

	calculateShift() {
		if (this.fieldApiName != "" && this.dateOfDemoSelected) {
			getMinutesToShift({ dateOfDemo: this.dateOfDemo, objectApiName: this.objectApiName, fieldApiName: this.fieldApiName })
				.then((result) => {
					this.mostRecent = result.mostRecent;
					this.returnedMinutes = result.minutes;
					this.minutesToShift = Math.abs(this.returnedMinutes);
					this.daysToShift = Math.round(Math.abs(this.returnedMinutes) / 60 / 24);
					this.forBack = this.returnedMinutes < 0 ? "backward" : "forward";
					this.shiftAmountVisible = this.fieldApiName != "" && this.dateOfDemoSelected;
					this.notifyParent(this.shiftAmountVisible);
				})
				.catch((error) => {
					this.error = error;
				});
		}
	}

	notifyParent(isSet) {
		this.dispatchEvent(
			new CustomEvent("datefilterchange", {
				detail: {
					isSet: isSet,
					minutesToShift: this.minutesToShift,
					daysToShift: this.daysToShift,
					forBack: this.forBack,
					objectApiName: this.objectApiName,
					fieldApiName: this.fieldApiName,
					dateOfDemo: this.dateOfDemo
				}
			})
		);
	}
}
