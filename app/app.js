// create the module and name it scotchApp
// also include ngRoute for all our routing needs
var app = angular.module('app', ['ngRoute', 'ngTouch', 'ui.grid', 'ui.grid.edit', 'ui.grid.exporter', 'addressFormatter']);

app.directive('onReadFile', function ($parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);

            element.on('change', function (onChangeEvent) {
                var reader = new FileReader();

                reader.onload = function (onLoadEvent) {
                    scope.$apply(function () {
                        fn(scope, {$fileContent: onLoadEvent.target.result});
                    });


                    var cases = [];
                    var lines = this.result.split('\n');
                    for (var line = 2; line < lines.length; line += 2) {
                        var nachaLineOne = lines[line];


                        if (nachaLineOne !== '' && isNaN(nachaLineOne[51])) {
                            var firstName = nachaLineOne.substring(51, 62).replace(/ /g, '');
                            var lastName = nachaLineOne.substring(63, 71).replace(/ /g, '');
                            var beneficiaryNumber = nachaLineOne.substring(12, 50).replace(/ /g, '');

                            var nachaLineTwo = lines[line + 1];

                            var dateOfDeath = nachaLineTwo.substring(17, 23);
                            var ssn = nachaLineTwo.substring(37, 46);
                            var paymentAmount = nachaLineTwo.substring(54, 83);
                            paymentAmount = paymentAmount.substring(0, paymentAmount.indexOf('\\'));

                            cases.push({
                                "firstName": firstName,
                                "lastName": lastName,
                                "beneficiaryNumber": beneficiaryNumber,
                                "dateOfDeath": dateOfDeath,
                                "ssn": ssn,
                                "paymentAmount": paymentAmount
                            });
                        }

                    }
                    console.log(cases);
                };


                reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
            });
        }
    };
});

angular.module('addressFormatter', []).filter('address', function () {
    return function (input) {
        return input.street + ', ' + input.city + ', ' + input.state + ', ' + input.zip;
    };
});

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

    // route for the home page
        .when('/', {
            templateUrl: 'pages/home.html',
            controller: 'homeController'
        })

        // route for the about page
        .when('/about', {
            templateUrl: 'pages/about.html',
            controller: 'aboutController'
        })

        // route for the contact page
        .when('/contact', {
            templateUrl: 'pages/contact.html',
            controller: 'contactController'
        })

        .when('/myCases', {
            templateUrl: 'pages/myCases.html',
            controller: 'myCasesController'
        })

        .when('/import', {
            templateUrl: 'pages/import.html',
            controller: 'importController'
        })

        .when('/cases', {
            templateUrl: 'pages/cases.html',
            controller: 'casesController'
        });
});


app.controller('importController', ['$scope', function ($scope) {
    $scope.showContent = function ($fileContent) {
        $scope.content = $fileContent;
    };
}]);

app.controller('homeController', function ($scope) {
    // create a message to display in our view
    $scope.message = 'Everyone come and see how good I look!';
});

app.controller('aboutController', function ($scope) {
    $scope.message = 'Look! I am an about page.';
});

app.controller('contactController', function ($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

app.controller('casesController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
        $scope.gridOptions = {};

        $scope.storeFile = function (gridRow, gridCol, files) {
            // ignore all but the first file, it can only select one anyway
            // set the filename into this column
            gridRow.entity.filename = files[0].name;

            // read the file and set it into a hidden column, which we may do stuff with later
            var setFile = function (fileContent) {
                gridRow.entity.file = fileContent.currentTarget.result;
                // put it on scope so we can display it - you'd probably do something else with it
                $scope.lastFile = fileContent.currentTarget.result;
                $scope.$apply();
            };
            var reader = new FileReader();
            reader.onload = setFile;
            reader.readAsText(files[0]);
        };

        $scope.gridOptions.columnDefs = [
            {name: 'id', enableCellEdit: false, width: '10%'},
            {name: 'name', displayName: 'Name (editable)', width: '20%'},
            {name: 'age', displayName: 'Age', type: 'number', width: '10%'},
            {
                name: 'gender', displayName: 'Gender', editableCellTemplate: 'ui-grid/dropdownEditor', width: '20%',
                cellFilter: 'mapGender', editDropdownValueLabel: 'gender', editDropdownOptionsArray: [
                {id: 1, gender: 'male'},
                {id: 2, gender: 'female'}
            ]
            },
            {name: 'registered', displayName: 'Registered', type: 'date', cellFilter: 'date:"yyyy-MM-dd"', width: '20%'},
            {name: 'address', displayName: 'Address', type: 'object', cellFilter: 'address', width: '30%'},
            {
                name: 'address.city', displayName: 'Address (even rows editable)', width: '20%',
                cellEditableCondition: function ($scope) {
                    return $scope.rowRenderIndex % 2;
                }
            },
            {name: 'isActive', displayName: 'Active', type: 'boolean', width: '10%'},
            {
                name: 'pet', displayName: 'Pet', width: '20%', editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownRowEntityOptionsArrayPath: 'foo.bar[0].options', editDropdownIdLabel: 'value'
            },
            {
                name: 'status', displayName: 'Status', width: '20%', editableCellTemplate: 'ui-grid/dropdownEditor',
                cellFilter: 'mapStatus',
                editDropdownOptionsFunction: function (rowEntity, colDef) {
                    var single;
                    var married = {id: 3, value: 'Married'};
                    if (rowEntity.gender === 1) {
                        single = {id: 1, value: 'Bachelor'};
                        return [single, married];
                    } else {
                        single = {id: 2, value: 'Nubile'};
                        return $timeout(function () {
                            return [single, married];
                        }, 100);
                    }
                }
            },
            {
                name: 'filename', displayName: 'File', width: '20%', editableCellTemplate: 'ui-grid/fileChooserEditor',
                editFileChooserCallback: $scope.storeFile
            }
        ];

        $scope.msg = {};

        $scope.gridOptions.onRegisterApi = function (gridApi) {
            //set gridApi on scope
            $scope.gridApi = gridApi;
            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                $scope.msg.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue;
                $scope.$apply();
            });
        };

        $http.get('data/sampleData.json')
            .success(function (data) {
                for (i = 0; i < data.length; i++) {
                    data[i].registered = new Date(data[i].registered);
                    data[i].gender = data[i].gender === 'male' ? 1 : 2;
                    if (i % 2) {
                        data[i].pet = 'fish';
                        data[i].foo = {bar: [{baz: 2, options: [{value: 'fish'}, {value: 'hamster'}]}]};
                    } else {
                        data[i].pet = 'dog';
                        data[i].foo = {bar: [{baz: 2, options: [{value: 'dog'}, {value: 'cat'}]}]};
                    }
                }
                $scope.gridOptions.data = data;
            });
    }])

    .filter('mapGender', function () {
        var genderHash = {
            1: 'male',
            2: 'female'
        };

        return function (input) {
            if (!input) {
                return '';
            } else {
                return genderHash[input];
            }
        };
    })

    .filter('mapStatus', function () {
        var genderHash = {
            1: 'Bachelor',
            2: 'Nubile',
            3: 'Married'
        };

        return function (input) {
            if (!input) {
                return '';
            } else {
                return genderHash[input];
            }
        };
    });

app.controller('myCasesController', ['$scope', '$http', function ($scope, $http) {
    $scope.gridOptions = {
        columnDefs: [
            {field: 'name'},
            {field: 'gender', visible: false},
            {field: 'company'}
        ],
        enableGridMenu: true,
        enableSelectAll: true,
        exporterCsvFilename: 'myFile.csv',
        exporterPdfDefaultStyle: {fontSize: 9},
        exporterPdfTableStyle: {margin: [30, 30, 30, 30]},
        exporterPdfTableHeaderStyle: {fontSize: 10, bold: true, italics: true, color: 'red'},
        exporterPdfHeader: {text: "My Header", style: 'headerStyle'},
        exporterPdfFooter: function (currentPage, pageCount) {
            return {text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle'};
        },
        exporterPdfCustomFormatter: function (docDefinition) {
            docDefinition.styles.headerStyle = {fontSize: 22, bold: true};
            docDefinition.styles.footerStyle = {fontSize: 10, bold: true};
            return docDefinition;
        },
        exporterPdfOrientation: 'portrait',
        exporterPdfPageSize: 'LETTER',
        exporterPdfMaxGridWidth: 500,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
        }
    };

    $http.get('data/100.json')
        .success(function (data) {
            $scope.gridOptions.data = data;
        });

}]);

