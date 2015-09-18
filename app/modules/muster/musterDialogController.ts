/// <reference path="../../common/app.module.ts" />
module app.muster {
    'use strict';

    class MusterDialogController {
        availableMoods = ['smile', 'laughing', 'blush', 'smiley', 'relaxed', 'smirk', 'heart-eyes',
            'kissing-heart', 'kissing-closed-eyes', 'flushed', 'relieved', 'satisfied', 'grin', 'wink',
            'stuck-out-tongue-winking-eye', 'stuck-out-tongue-closed-eyes', 'grinning', 'kissing', 'stuck-out-tongue',
            'sleeping', 'worried', 'frowning', 'anguished', 'open-mouth', 'grimacing', 'confused', 'expressionless',
            'unamused', 'weary', 'pensive', 'disappointed', 'confounded', 'fearful',
            'cold-sweat', 'persevere', 'cry', 'sob', 'joy', 'astonished', 'scream', 'tired-face', 'angry', 'rage',
            'sleepy', 'yum', 'mask', 'sunglasses', 'imp', 'neutral-face', 'innocent', 'alien', 'poop', 'thumbsup',
            'thumbsdown', 'ok-hand', 'punch', 'fist', 'v', 'no-mouth', '']; //Last entry allows user to clear out
        averageCheckInTime = null;
        chartObject = getChartObject();
        commonCheckinLocations = ['Angular-Point-Example', 'Hawthorne', 'Telework'];
        displayAdvancedMoodControl = false;
        mode = 'new';
        muster: Muster;
        person: Person;
        selectedTab = 'today';
        twemojiAwesomeIcons: string[];
        userHistory: Muster[] = [];
        versionHistory: ap.VersionHistoryCollection<Muster>;

        constructor(muster: Muster, private $modalInstance: ng.ui.bootstrap.IModalServiceInstance,
            twemojiAwesomeIcons: string[], user: IUser, musterModel: MusterModel, private toastr) {

            let vm = this;

            vm.muster = muster;
            vm.person = muster.getPersonnelDetails();
            vm.twemojiAwesomeIcons = twemojiAwesomeIcons;

            /** Clear notes if they exist because we already display historical notes so gives an option to add new info. */
            vm.muster.notes = '';
            vm.mode = muster.id ? 'edit' : 'new';

            /** Fetches the most recent 30 muster records for the current person */
            musterModel.fetchUserHistory(vm.person.userSid, 30)
                .then((indexedCache: ap.IndexedCache<Muster>) => {
                    vm.userHistory = indexedCache.toArray();
                    vm.averageCheckInTime = vm.processUserHistory(vm.userHistory);
                    _.each(indexedCache, (musterRecord: Muster) => {

                        /** Add previously selected locations to the locations dropdown options */
                        if (vm.commonCheckinLocations.indexOf(musterRecord.location) === -1) {
                            vm.commonCheckinLocations.push(musterRecord.location);
                        }

                        /** Add previously selected moods to the list of available moods */
                        if (musterRecord.mood && vm.availableMoods.indexOf(musterRecord.mood) === -1) {
                            vm.availableMoods.unshift(musterRecord.mood);
                        }

                    });
                });

            /** If muster record has already been saved to the server, get the version history */
            if(muster.id) {
                muster.getVersionHistory(['location', 'mood', 'notes'])
                    .then(function(versionHistory: ap.VersionHistoryCollection<Muster>) {
                        /** Expose to view */
                        vm.versionHistory = versionHistory;
                    });
            }

        }
        cancel() {
            this.$modalInstance.dismiss('cancel');
        }
        deleteRecord() {
            //Display confirmation dialog
            var confirmation = window.confirm('Are you sure you want to delete this muster record?');

            if (confirmation) {
                this.muster.deleteItem().then(() => {
                    this.toastr.success('Muster record deleted');
                    this.$modalInstance.close();
                }, function() {
                    this.toastr.error('There was a problem deleting this muster record');
                });
            }
        }

        /** Returns the average check-in time for the person */
        processUserHistory(musterRecords: Muster[]) {
            var sum = 0;
            var sumOfTime = 0;
            //Clear out any existing data
            this.chartObject.data.rows.length = 0;
            var dataRows = [];
            _.each(musterRecords, function(muster: Muster) {
                /** Normalize dates by making the date portion equal then average the milliseconds */
                var normalizedDate = new Date(muster.created).setFullYear(2000, 1, 1);
                sumOfTime += new Date(normalizedDate).getTime();

                //Create a decimal representation of the time
                var timeVal = muster.created.getHours() + muster.created.getMinutes() / 60;
                sum += timeVal;
                dataRows.push({
                    c: [
                        { v: muster.created },
                        { v: timeVal, f: moment(muster.created).format('hh:mm a') }
                    ]
                });
            });

            Array.prototype.push.apply(this.chartObject.data.rows, dataRows);
            return new Date(sumOfTime / musterRecords.length);
        }
        /**
         * Randomly set a mood
         */
        randomEmoji() {
            this.muster.mood = _.sample(this.twemojiAwesomeIcons);
        }
        save() {
            if (this.muster.location.length < 1) {
                return this.toastr.warning('A location is required to complete muster.')
            }

            return this.muster.saveChanges()
                .then(() => {
                    this.toastr.success('Muster updated');
                    this.$modalInstance.close();
                }, () => {
                    this.toastr.error('There was a problem updating this muster record');
                });
        }
        setMood(mood) {
            this.muster.mood = mood;
        }

    }


    function getChartObject() {
        return {
            type: 'LineChart',
            'displayed': true,
            'cssStyle': 'height:400px; width:510px;',
            options: {
                chartArea: {
                    left: 30,
                    top: 30,
                    width: '90%',
                    height: '70%'
                },
                fontName: '"Arial"',
                legend: {
                    position: 'none'
                },
                title: 'Most Recent Check-In\'s (30)',
                yAxis: {
                    minValue: 4,
                    maxValue: 22
                }
            },
            data: {
                cols: [
                    { label: 'Date', type: 'datetime' },
                    { label: 'Time', type: 'number' }
                ],
                rows: []
            }
        };
    }

    angular.module('angular-point-example')
        .controller('musterDialogController', MusterDialogController);


}
