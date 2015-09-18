/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

	let $filter: ng.IFilterService, musterModel: MusterModel, personnelModel: PersonnelModel;

	export class MusterIcon {
		constructor(private iconClass, private iconText, private listItem?) {

		}
		clickEvent($event) {
			//Open the list item Modal if a list item is provided
			if(this.listItem) {
                this.listItem.openModal();
                //Prevent click event from propogating to parent elements and
				//firing any listeners they have
                $event.stopPropagation();
			}
		}
	}

	export class MusterSummary {
		accountedFor = false;
		accountedForTooltipText: string;
		hasMustered = false;
		icons: MusterIcon[] = [];
		leave = new ap.IndexedCache<Leave>();
		leaveHours = 0;
		moodTooltip: string;
		muster: Muster;
		musterStatusText: string;
		onLeave = false;
		onTravel = false;
		person: Person;
		travel = new ap.IndexedCache<Travel>();
		userName: string;
		userSid: number;
		constructor(person: Person, musterForUser?: Muster, leaveForUser?: Leave[], travelForUser?: Travel[]) {
			this.processPerson(person);
			this.processLeave(leaveForUser);
			this.processTravel(travelForUser);
			this.processMuster(musterForUser);
			this.accountedFor = this.hasMustered || this.onLeave || this.onTravel;
			if (!this.accountedFor) {
				this.accountedForTooltipText = `<strong>${person.firstName}</strong> has not<br> been accounted for.`;
			}
		}
		get musterIconClass(): string {
			//Default to unaccountedFor icon
			var icon = 'fa-question txt-color-base-red';
			if(this.muster) {
                switch (this.muster.location) {
                    case 'Telework':
                        icon = 'fa-phone txt-color-base-green-dark';
                        break;
                    case 'Hawthorne':
                        icon = 'fa-crosshairs txt-color-base-green-dark';
                        break;
					default:
						icon = 'fa-check txt-color-base-green-dark';
                }
			} else if (this.accountedFor) {
				icon = 'fa-check txt-color-base-green-dark';
			}
			return icon;
		}
		openMusterModal() {
			musterModel.openModal(this.person);
		}
		private generateMusterText(text: string) {
			if (text.length > 50) {
				this.musterStatusText = text.substring(0, 44) + '...';
			}
			else {
				this.musterStatusText = text;
			}
		}
		private processPerson(person: Person) {
			this.person = person;
			this.userName = person.getFullName(true);
			this.userSid = person.userSid;
			//Default message
			this.musterStatusText = `${person.firstName} has not mustered`;
		}
		private processLeave(leaveForUser: Leave[] = []) {

			/** User has leave so process each request in the array of indexes */
            _.each(leaveForUser, (leave: Leave) => {
				/** Add to cache */
				this.leave.addEntity(leave);
				/** In case of multiple leave records, sum up accumulated leave */
                this.leaveHours += leave.hours;
				/** Generate an icon to display representing leave */
                let tooltip = `<strong>Leave</strong><br>
		            ${leave.date}<br>
		            ${leave.hours}&nbsp;hours`
				
                let icon = new MusterIcon('fa-home fa-lg', tooltip, leave);
				this.icons.push(icon);
            }, this);

            if (this.leaveHours >= 8) {
				this.accountedForTooltipText = `${this.person.firstName} is on leave.`;
				this.generateMusterText('All day leave')
                this.onLeave = true;
            }
		}
		private processMuster(musterForUser?: Muster) {
			if (musterForUser) {
                var createdBy = personnelModel.findBySiteId(musterForUser.author.lookupId);
                if (createdBy) {
                    this.accountedForTooltipText = `<strong>${musterForUser.location}</strong><br/>
                        Checked in at ${$filter('date')(musterForUser.created, 'HH:mm')}<br/>
                        by ${createdBy.firstName} ${createdBy.lastName}`;
                }
				this.generateMusterText(musterForUser.location);
				this.hasMustered = true;
				this.moodTooltip = `<i class="twa twa-3x twa-${musterForUser.mood}"></i>`;
				this.muster = musterForUser;
			}
		}

		private processTravel(travelForUser: Travel[] = []) {
			_.each(travelForUser, (travel: Travel) => {
				this.generateMusterText('On Travel ' + travel.location)
				
				/** Assume that travel is always all day */
				this.onTravel = true;
				
				/** Add to cache */
				this.travel.addEntity(travel);
				
				/** Generate an icon to display representing travel */
                var tooltip = `<strong>Travel</strong><br>
	                ${travel.location}<br>
	                ${$filter('date')(travel.travelStartDate, 'M/d/yy') } - ${$filter('date')(travel.travelEndDate, 'M/d/yy') }`;
				
				let icon = new MusterIcon('fa-plane fa-lg', tooltip, travel);
				this.icons.push(icon);
				this.accountedForTooltipText = `${this.person.firstName} is on travel.`;				
			}, this);
		}
	}

	export class MusterSummaryObjectFactory {
		constructor($injector: ng.auto.IInjectorService) {
			$filter = $injector.get('$filter');
			musterModel = $injector.get('musterModel');
			personnelModel = $injector.get('personnelModel');
		}
		generateSummaryObjects(personnel: ap.IndexedCache<Person>, musterToday: ap.IndexedCache<Muster>, leaveToday: ap.IndexedCache<Leave>, travelToday: ap.IndexedCache<Travel>): MusterSummary[] {
			let personnelBySid = _.indexBy(personnel, 'userSid');
			let musterBySid = _.indexBy(musterToday, 'userSid');
			let leaveBySid = _.groupBy(leaveToday, 'userSid');
			let travelBySid = _.groupBy(travelToday, 'userSid');

			let musterSummaryObjects = [];

			_.each(personnel, (person: Person) => {
				var userSid = person.userSid;
				var newSummaryObject = new MusterSummary(person, musterBySid[userSid], leaveBySid[userSid], travelBySid[userSid]);
				musterSummaryObjects.push(newSummaryObject);
			});

			return _.sortBy<MusterSummary>(musterSummaryObjects, 'userName');

		}
	}

    angular.module('angular-point-example')
        .service('musterSummaryObjectFactory', MusterSummaryObjectFactory);

}