var app = angular.module('plunker', []);

app.constant('dispatcher', new simflux.Dispatcher());

app.controller('MainCtrl', function($scope, colorUtils, colorStore) {
  $scope.colorStore = colorStore;
  $scope.fcolor = colorUtils.fcolor;
});

app.run(function(actionCreator) {
  actionCreator.init();
})

app.factory('actionCreator', function (dispatcher, colorApi) {
  return dispatcher.registerActionCreator({
    init: function() {
      colorApi.fetch().success(function(data) {
        dispatcher.dispatch('loaded:colors', {colors:data});
      });
    },
    toggleColor: function(payload) {
      dispatcher.dispatch('toggle:color', payload);
    },
    toggleAll: function() {
      dispatcher.dispatch('toggle:all');
    }
  })
});

app.factory('colorStore', function (dispatcher, colorFilters) {
  return dispatcher.registerStore({
    storeName: 'colorStore',
    colors: [],
    colorFilters: colorFilters,
    selectedColors: [], // which colors are selected out of colorFilters array?
    allSelected: true,
    
    updateSelected: function() {
      // update the list of colors which are selected
      // this is used by the ng-repeat in index.html to filter
      // the color list
      this.selectedColors = this.colorFilters.filter(function(color) {
        return color.selected;
      })
      this.allSelected = this.selectedColors.length === this.colorFilters.length;
    },
    
    'loaded:colors': function(payload) {
      this.colors = payload.colors.map(function(c,i) {
        // add index property to each color to make it
        // easy to track inside of the ng-repeat
        c.index = i;
        return c;
      });
      this.updateSelected();
    },
    
    'toggle:color': function(payload) {
      payload.color.selected = !payload.color.selected;
      this.updateSelected();
    },
    
    'toggle:all': function() {
      var newV = !this.allSelected;
      this.colorFilters.forEach(function(color) {
        color.selected = newV;
      });
      this.updateSelected();
    }
  })
});

app.directive('colorSelector', function(colorUtils, actionCreator) {
  return {
    scope: {
      colors: '=',
      allSelected: '='
    },
    templateUrl: 'color-selector.html',
    link: function(scope) {
      scope.fcolor = colorUtils.fcolor;
      
      scope.clickColor = function(color) {
        actionCreator.toggleColor({color:color});
      };
      
      // the 'All' toggle button was clicked
      scope.clickAll = function() {
        actionCreator.toggleAll();
      };
    }
  }
});


//// All of the code below is exactly the same in 
//// this version and in the non-flux version


// given a list of colors, will filter by fuzzy-match
// comparing to another list of colors (filterColors)
app.filter('similarColors', function(colorUtils) {
  return function(colors, filterColors) {
    var r = [];
    if ((colors instanceof Array) && (filterColors instanceof Array)) {
      colors.forEach(function(color) {
        if (filterColors.some(colorUtils.fuzzyMatch.bind(null,color)))
          r.push(color);
      })
    }
    return r;
  }
});

app.factory('colorApi', function ($http) {
  var numRows = 1000;
  return {
    // a simple HTTP API that returns a bunch of random colors
    fetch: $http.get.bind($http, "http://www.filltext.com/?rows="+numRows+"&r={number|255}&g={number|255}&b={number|255}")
  }
});

app.factory('colorUtils', function () {
  var thresh = 120; // fuzzy match threshold
  
  return {
    
    // converts a color object like {r:125,g:0,b:255}
    // to a css value like "rgb(125,0,255)"
    fcolor: function(color) {
      return 'rgb('+color.r+','+color.g+','+color.b+')'
    },
    
    // fuzzily compares two colors and returns true if 
    // they match
    fuzzyMatch: function(c1, c2) {
      return (Math.abs(c1.r-c2.r) < thresh && Math.abs(c1.g-c2.g) < thresh && Math.abs(c1.b-c2.b) < thresh)
    }
  }
});

// these are the colors that will be utilized by the
// color-selector directive
app.value('colorFilters', [
  {selected:true,r:255,g:0,b:0},
  {selected:true,r:0,g:255,b:0},
  {selected:true,r:0,g:0,b:255},
  {selected:true,r:128,g:0,b:128},
  {selected:true,r:0,g:128,b:128},
  {selected:true,r:128,g:128,b:0},
  {selected:true,r:255,g:255,b:0},
  {selected:true,r:0,g:255,b:255},
  {selected:true,r:255,g:0,b:255}
]);
