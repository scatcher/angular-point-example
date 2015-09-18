module app.eoq {
    'use strict';

	export class FiveStartFormlyTemplate {
		constructor(formlyConfigProvider: AngularFormly.IFormlyConfig) {

			formlyConfigProvider.setType({
				name: 'eoqFiveStarRating',
				template: `
				<div class="row" style="padding-bottom:8px;">
					<div class="col-md-9 col-sm-7 col-xs-12">
						{{model.getFieldDescription(options.key)}}
					</div>
					<div class="col-md-3 col-sm-5 col-xs-12">
						<rating ng-model="model[options.key]" max="5" class="pull-right" 
						state-on="'fa fa-star fa-2x fa-fw txt-color-base-yellow pointer'"
						state-off="'fa fa-star-o fa-2x fa-fw pointer'"></rating>
					</div>
				</div>
				`
			});
		}
	}

	angular
        .module('angular-point-example')
        .config(FiveStartFormlyTemplate);

}